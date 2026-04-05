import { defineWidgetConfig } from "@medusajs/admin-sdk"
import {
  DetailWidgetProps,
  AdminProductCategory,
} from "@medusajs/framework/types"
import { Container, Heading, Button, Input, Text, Badge } from "@medusajs/ui"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { sdk } from "../lib/sdk"

type AttributeType = "text" | "number" | "file" | "boolean"

type CategoryCustomAttribute = {
  id: string
  label: string
  type: AttributeType
  unit: string | null
  category_id: string
  inherited: boolean
  source_category_id: string
}

type FormState = {
  label: string
  type: AttributeType
  unit: string
}

const emptyForm = (): FormState => ({ label: "", type: "text", unit: "" })

const CategoryAttributeTemplatesWidget = ({
  data,
}: DetailWidgetProps<AdminProductCategory>) => {
  const categoryId = data.id
  const qc = useQueryClient()
  const queryKey = ["category-custom-attributes", categoryId]

  const [showAddForm, setShowAddForm] = useState(false)
  const [showPresetList, setShowPresetList] = useState(false)
  const [addForm, setAddForm] = useState<FormState>(emptyForm())
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [mutationError, setMutationError] = useState<string | null>(null)

  const presetsQuery = useQuery<{
    attribute_presets: Array<{
      id: string
      label: string
      type: AttributeType
      unit: string | null
    }>
  }>({
    queryKey: ["attribute-presets"],
    queryFn: () => sdk.client.fetch(`/admin/attribute-presets`),
    enabled: showPresetList,
  })

  const applyPresetMutation = useMutation({
    mutationFn: (presetId: string) =>
      sdk.client.fetch(`/admin/attribute-presets/${presetId}/apply`, {
        method: "POST",
        body: { category_id: categoryId },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey })
      setShowPresetList(false)
    },
    onError: (err: any) => {
      setMutationError(err?.message || "Ошибка при применении пресета")
    },
  })

  const {
    data: result,
    isLoading,
    isError,
  } = useQuery<{
    category_custom_attributes: CategoryCustomAttribute[]
  }>({
    queryKey,
    queryFn: () =>
      sdk.client.fetch(`/admin/category/${categoryId}/custom-attributes`),
  })

  const attributes = result?.category_custom_attributes ?? []
  const ownAttributes = attributes.filter((a) => !a.inherited)
  const inheritedAttributes = attributes.filter((a) => a.inherited)

  const createMutation = useMutation({
    mutationFn: (body: { label: string; type: string; unit?: string | null }) =>
      sdk.client.fetch(`/admin/category/${categoryId}/custom-attributes`, {
        method: "POST",
        body,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey })
      setShowAddForm(false)
      setAddForm(emptyForm())
      setMutationError(null)
    },
    onError: (err: any) => {
      setMutationError(err?.message || "Ошибка при создании атрибута")
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      sdk.client.fetch(`/admin/category/${categoryId}/custom-attributes`, {
        method: "PATCH",
        body: { id, deleted_at: new Date().toISOString() },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey })
      setConfirmDeleteId(null)
    },
  })

  const handleAdd = () => {
    if (!addForm.label.trim()) return
    createMutation.mutate({
      label: addForm.label.trim(),
      type: addForm.type,
      unit: addForm.type === "number" && addForm.unit.trim()
        ? addForm.unit.trim()
        : null,
    })
  }

  const typeLabel = (t: string) =>
    t === "text" ? "Текст"
    : t === "number" ? "Число"
    : t === "file" ? "Файл"
    : t === "boolean" ? "Да/Нет"
    : t

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Атрибуты</Heading>
        {!showAddForm && !showPresetList && (
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="small"
              onClick={() => setShowPresetList(true)}
            >
              Из пресета
            </Button>
            <Button
              variant="secondary"
              size="small"
              onClick={() => setShowAddForm(true)}
            >
              + Добавить
            </Button>
          </div>
        )}
      </div>

      {showPresetList && (
        <div className="px-6 py-3">
          <div className="mb-2 flex items-center justify-between">
            <Text size="small" weight="plus">Выберите пресет</Text>
            <Button
              size="small"
              variant="secondary"
              onClick={() => setShowPresetList(false)}
            >
              Закрыть
            </Button>
          </div>
          {presetsQuery.isLoading && (
            <Text className="text-ui-fg-muted text-sm">Загрузка…</Text>
          )}
          {presetsQuery.data?.attribute_presets.length === 0 && (
            <Text className="text-ui-fg-muted text-sm">
              Пресетов нет. Создайте в настройках Product Attributes.
            </Text>
          )}
          <div className="flex flex-col gap-1">
            {presetsQuery.data?.attribute_presets.map((p) => (
              <button
                key={p.id}
                onClick={() => applyPresetMutation.mutate(p.id)}
                disabled={applyPresetMutation.isPending}
                className="flex items-center justify-between rounded border border-ui-border-base px-3 py-2 text-left text-sm hover:bg-ui-bg-subtle disabled:opacity-50"
              >
                <span>{p.label}</span>
                <Badge size="2xsmall" color="grey">
                  {typeLabel(p.type)}{p.unit ? `, ${p.unit}` : ""}
                </Badge>
              </button>
            ))}
          </div>
        </div>
      )}

      {isLoading && (
        <div className="px-6 py-4">
          <Text className="text-ui-fg-muted text-sm">Загрузка…</Text>
        </div>
      )}

      {isError && (
        <div className="px-6 py-4">
          <Text className="text-ui-fg-error text-sm">
            Не удалось загрузить атрибуты.
          </Text>
        </div>
      )}

      {inheritedAttributes.length > 0 && (
        <>
          <div className="px-6 py-2 bg-ui-bg-subtle">
            <Text size="xsmall" weight="plus" className="text-ui-fg-muted uppercase">
              Унаследованные
            </Text>
          </div>
          <div className="divide-y">
            {inheritedAttributes.map((attr) => (
              <div
                key={attr.id}
                className="flex items-center gap-3 px-6 py-3"
              >
                <span className="flex-1 text-sm text-ui-fg-subtle">
                  {attr.label}
                </span>
                <Badge size="2xsmall" color="grey">
                  {typeLabel(attr.type)}{attr.unit ? `, ${attr.unit}` : ""}
                </Badge>
                <Badge size="2xsmall" color="blue">
                  из родителя
                </Badge>
              </div>
            ))}
          </div>
        </>
      )}

      {ownAttributes.length > 0 && (
        <>
          {inheritedAttributes.length > 0 && (
            <div className="px-6 py-2 bg-ui-bg-subtle">
              <Text size="xsmall" weight="plus" className="text-ui-fg-muted uppercase">
                Свои
              </Text>
            </div>
          )}
          <div className="divide-y">
            {ownAttributes.map((attr) =>
              confirmDeleteId === attr.id ? (
                <div
                  key={attr.id}
                  className="flex items-center gap-3 px-6 py-3 text-sm"
                >
                  <span className="flex-1 text-ui-fg-base">
                    Удалить «{attr.label}»?
                  </span>
                  <Button
                    size="small"
                    variant="danger"
                    onClick={() => deleteMutation.mutate(attr.id)}
                    isLoading={deleteMutation.isPending}
                  >
                    Удалить
                  </Button>
                  <Button
                    size="small"
                    variant="secondary"
                    onClick={() => setConfirmDeleteId(null)}
                  >
                    Отмена
                  </Button>
                </div>
              ) : (
                <div
                  key={attr.id}
                  className="flex items-center gap-3 px-6 py-3"
                >
                  <span className="flex-1 text-sm text-ui-fg-base">
                    {attr.label}
                  </span>
                  <Badge size="2xsmall" color="grey">
                    {typeLabel(attr.type)}{attr.unit ? `, ${attr.unit}` : ""}
                  </Badge>
                  <button
                    onClick={() => setConfirmDeleteId(attr.id)}
                    className="text-xs text-ui-fg-error hover:underline"
                  >
                    Удалить
                  </button>
                </div>
              )
            )}
          </div>
        </>
      )}

      {!isLoading && !isError && attributes.length === 0 && !showAddForm && (
        <div className="px-6 py-4">
          <Text className="text-ui-fg-muted text-sm">
            Нет атрибутов. Добавьте первый.
          </Text>
        </div>
      )}

      {showAddForm && (
        <div className="flex items-center gap-2 px-6 py-3">
          <Input
            value={addForm.label}
            onChange={(e) =>
              setAddForm((f) => ({ ...f, label: e.target.value }))
            }
            placeholder="Название атрибута"
            className="flex-1 h-8 text-sm"
            autoFocus
          />
          <select
            value={addForm.type}
            onChange={(e) =>
              setAddForm((f) => ({
                ...f,
                type: e.target.value as AttributeType,
                unit: e.target.value === "number" ? f.unit : "",
              }))
            }
            className="h-8 rounded border border-ui-border-base bg-ui-bg-base px-2 text-sm"
          >
            <option value="text">Текст</option>
            <option value="number">Число</option>
            <option value="file">Файл</option>
            <option value="boolean">Да/Нет</option>
          </select>
          {addForm.type === "number" && (
            <Input
              value={addForm.unit}
              onChange={(e) =>
                setAddForm((f) => ({ ...f, unit: e.target.value }))
              }
              placeholder="ед. (кг, м, шт...)"
              className="w-28 h-8 text-sm"
            />
          )}
          <Button
            size="small"
            onClick={handleAdd}
            isLoading={createMutation.isPending}
          >
            Добавить
          </Button>
          <Button
            variant="secondary"
            size="small"
            onClick={() => {
              setShowAddForm(false)
              setAddForm(emptyForm())
              setMutationError(null)
            }}
          >
            Отмена
          </Button>
        </div>
      )}

      {mutationError && (
        <div className="px-6 py-2">
          <Text className="text-ui-fg-error text-sm">{mutationError}</Text>
        </div>
      )}
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product_category.details.after",
})

export default CategoryAttributeTemplatesWidget
