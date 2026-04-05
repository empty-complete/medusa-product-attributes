import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { CUSTOM_ATTRIBUTE_MODULE } from "../../../../../modules/product-attributes"
import type CustomAttributeService from "../../../../../modules/product-attributes/service"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  const { category_id } = req.body as { category_id: string }
  const service: CustomAttributeService = req.scope.resolve(CUSTOM_ATTRIBUTE_MODULE)
  const category_custom_attribute = await service.applyPresetToCategory(id, category_id)
  res.status(201).json({ category_custom_attribute })
}
