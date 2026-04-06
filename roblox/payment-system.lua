--[[
    Syck Interactive – Robux Payment System

    SETUP INSTRUCTIONS:
    1. Create a new Roblox game (or use existing)
    2. Add this script to ServerScriptService
    3. Update the CONFIGURATION section below
    4. Set ROBUX_WEBHOOK_SECRET in your Vercel environment variables
       (must match WEBHOOK_SECRET below exactly)
    5. Set ROBLOX_COOKIE and ROBLOX_UNIVERSE_ID in your Vercel environment
       variables so the server can auto-create Developer Products as needed.

    HOW IT WORKS:
    1. Player buys a product on syckinteractive.com with Robux (coupon or full price)
    2. Website gives them a 6-character code (valid for 30 minutes)
    3. Player enters code in this Roblox game
    4. Game validates code against the website API
       - The API returns the EXACT Roblox Developer Product ID to charge
       - If the product doesn't exist yet (e.g. coupon price), the server
         auto-creates it and returns the new ID
    5. Game prompts the Developer Product purchase for the correct amount
    6. On successful purchase, game notifies the website
    7. Website unlocks the file download in the player's account
--]]

-- ============================================
-- CONFIGURATION - UPDATE THESE VALUES
-- ============================================

local CONFIG = {
	API_BASE_URL = "https://www.syckinteractive.space/api/robux",

	-- Webhook secret — must match ROBUX_WEBHOOK_SECRET in your Vercel env vars
	WEBHOOK_SECRET = "Zm9ybWVyYnJpZWZub2lzZWJhbGxvb25taXh0dXJlc3RyYXd3ZXN0ZXJub25ldHJ1dGg=",

	-- Fallback local product IDs used if the API doesn't return robloxProductId.
	-- The server now auto-creates products for any price, so this is rarely needed.
	PRODUCT_IDS = {
		[5] = 3537622381,
		[10] = 3537622543,
		[20] = 3537622856,
		[25] = 3537623034,
		[30] = 3537623980,
		[40] = 3537624233,
		[50] = 3537624334,
		[100] = 3521491558,
		[150] = 3537638673,
		[200] = 3537639188,
		[250] = 3521491562,
		[300] = 3537639501,
		[350] = 3537639703,
		[400] = 3537639960,
		[450] = 3537640200,
		[500] = 3521491561,
		[550] = 3537641595,
		[600] = 3537641764,
		[650] = 3537641826,
		[700] = 3537641931,
		[750] = 3537642044,
		[800] = 3537642115,
		[850] = 3537642173,
		[900] = 3537642244,
		[950] = 3537642425,
		[1000] = 3521491563,
		[1500] = 3537644573,
		[2500] = 3521491556,
		[3000] = 3537644682,
		[3500] = 3537644764,
		[4000] = 3537644918,
		[4500] = 3537644991,
		[5000] = 3537645049,
	},
}

-- ============================================
-- SERVICES
-- ============================================

local HttpService = game:GetService("HttpService")
local MarketplaceService = game:GetService("MarketplaceService")
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

-- ============================================
-- REMOTE EVENTS
-- ============================================

local remotesFolder = Instance.new("Folder")
remotesFolder.Name = "RobuxPayment"
remotesFolder.Parent = ReplicatedStorage

local submitCodeRemote = Instance.new("RemoteFunction")
submitCodeRemote.Name = "SubmitCode"
submitCodeRemote.Parent = remotesFolder

local statusRemote = Instance.new("RemoteEvent")
statusRemote.Name = "StatusUpdate"
statusRemote.Parent = remotesFolder

-- ============================================
-- PENDING PURCHASES
-- ============================================

local pendingPurchases = {}

-- ============================================
-- LOAD LIVE PRODUCT MAP FROM SERVER (startup)
-- ============================================
-- Fetches the latest price→productId mapping from the website.
-- New products created server-side (e.g. for coupon prices) are included here.

local liveProductMap = {}

task.spawn(function()
	local ok, res = pcall(function()
		return HttpService:RequestAsync({
			Url = CONFIG.API_BASE_URL .. "/products",
			Method = "GET",
		})
	end)
	if ok and res.StatusCode == 200 then
		local decodeOk, data = pcall(HttpService.JSONDecode, HttpService, res.Body)
		if decodeOk and type(data) == "table" then
			for priceStr, productId in pairs(data) do
				local price = tonumber(priceStr)
				if price and productId then
					liveProductMap[price] = productId
				end
			end
			print("[SyckPayment] Loaded " .. tostring(#(function() local t={} for _ in pairs(liveProductMap) do table.insert(t,1) end return t end)()) .. " products from server")
		end
	else
		warn("[SyckPayment] Could not load live product map, using local fallback")
	end
end)

-- ============================================
-- API FUNCTIONS
-- ============================================

local function validateCode(code, player)
	local success, response = pcall(function()
		return HttpService:RequestAsync({
			Url = CONFIG.API_BASE_URL .. "/validate-code",
			Method = "POST",
			Headers = { ["Content-Type"] = "application/json" },
			Body = HttpService:JSONEncode({
				code = code,
				robloxUserId = tostring(player.UserId),
				robloxUsername = player.Name
			})
		})
	end)

	if not success then
		warn("[SyckPayment] API request failed:", response)
		return false, "Connection error. Please try again."
	end

	if response.StatusCode ~= 200 then
		local ok, data = pcall(HttpService.JSONDecode, HttpService, response.Body)
		return false, (ok and data.error) or "Invalid code"
	end

	local data = HttpService:JSONDecode(response.Body)
	return true, data
end

local function notifyPurchaseComplete(pending, player, receiptInfo)
	local success, response = pcall(function()
		return HttpService:RequestAsync({
			Url = CONFIG.API_BASE_URL .. "/webhook",
			Method = "POST",
			Headers = { ["Content-Type"] = "application/json" },
			Body = HttpService:JSONEncode({
				code = pending.code,
				robloxUserId = tostring(player.UserId),
				robloxUsername = player.Name,
				transactionId = tostring(receiptInfo.PurchaseId),
				robuxAmount = pending.robuxPrice,
				secret = CONFIG.WEBHOOK_SECRET
			})
		})
	end)

	if not success then
		warn("[SyckPayment] Webhook failed:", response)
		return false
	end

	return response.StatusCode == 200
end

-- ============================================
-- FIND PRODUCT ID (live map → local fallback → nearest above)
-- ============================================

local function getProductIdForPrice(robuxPrice)
	-- 1. Check live map loaded from server (includes newly created products)
	if liveProductMap[robuxPrice] then
		return liveProductMap[robuxPrice], robuxPrice
	end

	-- 2. Check local hardcoded table
	if CONFIG.PRODUCT_IDS[robuxPrice] then
		return CONFIG.PRODUCT_IDS[robuxPrice], robuxPrice
	end

	-- 3. Fallback: nearest price above in local table
	local sortedPrices = {}
	for price, productId in pairs(CONFIG.PRODUCT_IDS) do
		if productId > 0 then
			table.insert(sortedPrices, price)
		end
	end
	table.sort(sortedPrices)

	for _, price in ipairs(sortedPrices) do
		if price >= robuxPrice then
			return CONFIG.PRODUCT_IDS[price], price
		end
	end

	if #sortedPrices > 0 then
		local highest = sortedPrices[#sortedPrices]
		return CONFIG.PRODUCT_IDS[highest], highest
	end

	return nil, nil
end

-- ============================================
-- CODE SUBMISSION
-- ============================================

submitCodeRemote.OnServerInvoke = function(player, code)
	if not code or type(code) ~= "string" or #code ~= 6 then
		return { success = false, message = "Please enter a valid 6-character code" }
	end

	code = string.upper(code)

	local valid, result = validateCode(code, player)
	if not valid then
		return { success = false, message = result }
	end

	-- Prefer the robloxProductId returned directly by the server.
	-- The server auto-creates a Developer Product for any price (including discounted),
	-- so this will be exact. Fall back to local lookup only if the server didn't return it.
	local productId, actualPrice

	if result.robloxProductId and result.robloxProductId ~= nil then
		productId = result.robloxProductId
		actualPrice = result.robuxPrice
		-- Also cache in live map for future reference
		liveProductMap[result.robuxPrice] = result.robloxProductId
	else
		productId, actualPrice = getProductIdForPrice(result.robuxPrice)
	end

	if not productId then
		return { success = false, message = "No payment product configured for this price. Contact support." }
	end

	pendingPurchases[player.UserId] = {
		code = code,
		productId = result.productId,
		productName = result.productName,
		robuxPrice = result.robuxPrice,
		actualPrice = actualPrice
	}

	MarketplaceService:PromptProductPurchase(player, productId)

	return {
		success = true,
		message = "Purchase prompted!",
		productName = result.productName,
		robuxPrice = actualPrice
	}
end

-- ============================================
-- PURCHASE HANDLER
-- ============================================

local function processReceipt(receiptInfo)
	local player = Players:GetPlayerByUserId(receiptInfo.PlayerId)
	if not player then
		return Enum.ProductPurchaseDecision.NotProcessedYet
	end

	local pending = pendingPurchases[receiptInfo.PlayerId]
	if not pending then
		return Enum.ProductPurchaseDecision.NotProcessedYet
	end

	local notified = notifyPurchaseComplete(pending, player, receiptInfo)

	if notified then
		pendingPurchases[receiptInfo.PlayerId] = nil

		statusRemote:FireClient(player, {
			type = "success",
			message = "Payment complete! Your file is ready to download at syckinteractive.com/purchases",
			productName = pending.productName
		})

		return Enum.ProductPurchaseDecision.PurchaseGranted
	else
		statusRemote:FireClient(player, {
			type = "error",
			message = "Purchase recorded but notification failed. Contact support with code: " .. pending.code
		})

		return Enum.ProductPurchaseDecision.NotProcessedYet
	end
end

MarketplaceService.ProcessReceipt = processReceipt

-- ============================================
-- CLEANUP
-- ============================================

Players.PlayerRemoving:Connect(function(player)
	task.delay(300, function()
		pendingPurchases[player.UserId] = nil
	end)
end)

-- ============================================
-- CLIENT SCRIPT (add to StarterPlayerScripts)
-- ============================================

--[[
	See roblox/payment-client.lua for the LocalScript
--]]
