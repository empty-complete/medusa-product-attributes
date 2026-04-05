import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { CUSTOM_ATTRIBUTE_MODULE } from "../../../../../modules/product-attributes"
import type CustomAttributeService from "../../../../../modules/product-attributes/service"

/**
 * Walk up the category tree, starting from `leafId`, collecting ids of the
 * category itself and all of its ancestors. Ordered leaf → root.
 *
 * A hard cap of 20 levels guards against cycles in malformed data.
 */
async function resolveAncestorChain(
  productService: any,
  leafId: string
): Promise<string[]> {
  const chain: string[] = []
  let currentId: string | null = leafId
  let depth = 0
  while (currentId && depth < 20) {
    chain.push(currentId)
    const category: any = await productService.retrieveProductCategory(currentId, {
      select: ["id", "parent_category_id"],
    })
    currentId = (category?.parent_category_id as string | null) ?? null
    depth++
  }
  return chain
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { categoryId } = req.params
  const service: CustomAttributeService = req.scope.resolve(CUSTOM_ATTRIBUTE_MODULE)
  const productService = req.scope.resolve(Modules.PRODUCT)

  const categoryIds = await resolveAncestorChain(productService, categoryId)
  const category_custom_attributes = await service.getAttributesByCategoryIds(categoryIds)

  res.json({ category_custom_attributes })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { categoryId } = req.params
  const { label, type, unit, sort_order } = req.body as {
    label: string
    type?: string
    unit?: string
    sort_order?: number
  }

  const service: CustomAttributeService = req.scope.resolve(CUSTOM_ATTRIBUTE_MODULE)

  const category_custom_attribute = await service.createCategoryAttribute({
    label,
    type: type || "text",
    unit: unit || null,
    category_id: categoryId,
    sort_order,
  })

  res.status(201).json({ category_custom_attribute })
}

export async function PATCH(req: MedusaRequest, res: MedusaResponse) {
  const service: CustomAttributeService = req.scope.resolve(CUSTOM_ATTRIBUTE_MODULE)
  const { id, ...data } = req.body as {
    id: string
    label?: string
    type?: string
    unit?: string
    sort_order?: number
    deleted_at?: string
  }

  const category_custom_attribute = await service.updateCategoryAttribute(id, data)

  res.json({ category_custom_attribute })
}
