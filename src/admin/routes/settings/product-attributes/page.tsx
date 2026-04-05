import { defineRouteConfig } from "@medusajs/admin-sdk"
import { CogSixTooth } from "@medusajs/icons"
import { Container, Heading, Button, Input, Text, Badge } from "@medusajs/ui"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { sdk } from "../../../lib/sdk"

type AttributeType = "text" | "number" | "file" | "boolean"

type AttributePreset = {
  id: string
  key: string
  label: string
  type: AttributeType
  unit: string | null
  description: string | null
}

type FormState = {
  label: string
  type: AttributeType
  unit: string
  description: string
}

const emptyForm = (): FormState => ({
  label: "",
  type: "text",
  unit: "",
  description: "",
})

const typeLabel = (t: string) =>
  t === "text" ? "Текст"
  : t === "number" ? "Число"
  : t === "file" ? "Файл"
  : t === "boolean" ? "Да/Нет"
  : t

const ProductAttributesSettingsPage = () => {
  const qc = useQueryClient()
  const queryKey = ["attribute-presets"]

  const [showAddForm, setShowAddForm] = useState(false)
  const [addForm, setAddForm] = useState<FormState>(emptyForm())
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const { data, isLoading, isError } = useQuery<{
    attribute_presets: AttributePreset[]
  }>({
    queryKey,
    queryFn: () => sdk.client.fetch(`/admin/attribute-presets`),
  })

  const presets = data?.attribute_presets ?? []

  const createMutation = useMutation({
    mutationFn: (body: FormState) =>
      sdk.client.fetch(`/admin/attribute-presets`, {
        method: "POST",
        body: {
          label: body.label,
          type: body.type,
          unit: body.type === "number" && body.unit ? body.unit : null,
          description: body.description || null,
        },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey })
      setShowAddForm(false)
      setAddForm(emptyForm())
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      sdk.client.fetch(`/admin/attribute-presets`, {
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
      ...addForm,
      label: addForm.label.trim(),
      unit: addForm.unit.trim(),
      description: addForm.description.trim(),
    })
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h1">Пресеты атрибутов</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Глобальные шаблоны атрибутов, которые можно применить к любой категории.
          </Text>
        </div>
        {!showAddForm && (
          <Button
            variant="secondary"
            size="small"
            onClick={() => setShowAddForm(true)}
          >
            + Добавить пресет
          </Button>
        )}
      </div>

      {isLoading && (
        <div className="px-6 py-4">
          <Text className="text-ui-fg-muted text-sm">Загрузка…</Text>
        </div>
      )}

      {isError && (
        <div className="px-6 py-4">
          <Text className="text-ui-fg-error text-sm">
            Не удалось загрузить пресеты.
          </Text>
        </div>
      )}

      {!isLoading && !isError && presets.length === 0 && !showAddForm && (
        <div className="px-6 py-4">
          <Text className="text-ui-fg-muted text-sm">
            Пресетов пока нет. Добавьте первый.
          </Text>
        </div>
      )}

      <div className="divide-y">
        {presets.map((p) =>
          confirmDeleteId === p.id ? (
            <div
              key={p.id}
              className="flex items-center gap-3 px-6 py-3 text-sm"
            >
              <span className="flex-1">Удалить «{p.label}»?</span>
              <Button
                size="small"
                variant="danger"
                onClick={() => deleteMutation.mutate(p.id)}
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
            <div key={p.id} className="flex items-center gap-3 px-6 py-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Text size="small" weight="plus">
                    {p.label}
                  </Text>
                  <Badge size="2xsmall" color="grey">
                    {typeLabel(p.type)}{p.unit ? `, ${p.unit}` : ""}
                  </Badge>
                </div>
                {p.description && (
                  <Text size="xsmall" className="text-ui-fg-subtle">
                    {p.description}
                  </Text>
                )}
              </div>
              <button
                onClick={() => setConfirmDeleteId(p.id)}
                className="text-xs text-ui-fg-error hover:underline"
              >
                Удалить
              </button>
            </div>
          )
        )}
      </div>

      {showAddForm && (
        <div className="flex flex-col gap-2 px-6 py-4">
          <div className="flex items-center gap-2">
            <Input
              value={addForm.label}
              onChange={(e) =>
                setAddForm((f) => ({ ...f, label: e.target.value }))
              }
              placeholder="Название (например, Сертификат)"
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
                placeholder="ед. (кг, м...)"
                className="w-28 h-8 text-sm"
              />
            )}
          </div>
          <Input
            value={addForm.description}
            onChange={(e) =>
              setAddForm((f) => ({ ...f, description: e.target.value }))
            }
            placeholder="Описание (необязательно)"
            className="h-8 text-sm"
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              size="small"
              onClick={() => {
                setShowAddForm(false)
                setAddForm(emptyForm())
              }}
            >
              Отмена
            </Button>
            <Button
              size="small"
              onClick={handleAdd}
              isLoading={createMutation.isPending}
            >
              Создать
            </Button>
          </div>
        </div>
      )}
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Product Attributes",
  icon: CogSixTooth,
})

export default ProductAttributesSettingsPage
