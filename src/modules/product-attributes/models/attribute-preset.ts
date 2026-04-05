import { model } from "@medusajs/framework/utils"

const AttributePreset = model.define("attribute_preset", {
  id: model.id().primaryKey(),
  key: model.text(),
  label: model.text(),
  type: model.text().default("text"),
  unit: model.text().nullable(),
  description: model.text().nullable(),
})

export default AttributePreset
