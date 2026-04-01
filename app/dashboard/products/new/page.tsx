import { ProductForm } from "@/components/dashboard/product-form"

export default function NewProductPage() {
  return (
    <div>
      <div className="mb-8">
        <p className="font-mono text-xs text-muted-foreground uppercase tracking-wider mb-1">
          Dashboard
        </p>
        <h1 className="font-display text-2xl">Create New Product</h1>
      </div>
      <ProductForm />
    </div>
  )
}
