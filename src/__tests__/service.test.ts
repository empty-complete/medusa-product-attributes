import { describe, it, expect, beforeEach } from '@jest/globals'
import CustomAttributeService from '../modules/product-attributes/service'

describe('CustomAttributeService', () => {
  let service: CustomAttributeService

  beforeEach(() => {
    service = new CustomAttributeService()
  })

  describe('generateKey', () => {
    it('should convert label to snake_case key', () => {
      // @ts-ignore - private method
      expect(service.generateKey('Product Name')).toBe('product_name')
      // @ts-ignore - private method
      expect(service.generateKey('Weight (kg)')).toBe('weight_kg')
      // @ts-ignore - private method
      expect(service.generateKey('3D Model')).toBe('3d_model')
    })

    it('should remove leading and trailing underscores', () => {
      // @ts-ignore - private method
      expect(service.generateKey('_test_')).toBe('test')
      // @ts-ignore - private method
      expect(service.generateKey('__special__')).toBe('special')
    })

    it('should handle empty strings', () => {
      // @ts-ignore - private method
      expect(service.generateKey('')).toBe('')
    })
  })

  describe('getCategoryAttributes', () => {
    it('should call listCategoryCustomAttributes with correct filter', async () => {
      const categoryId = 'test-category-123'

      // Mock the underlying method
      const mockAttributes = [
        { id: '1', key: 'color', label: 'Color', type: 'text' },
        { id: '2', key: 'size', label: 'Size', type: 'text' },
      ]
      service.listCategoryCustomAttributes = jest.fn().mockResolvedValue(mockAttributes)

      const result = await service.getCategoryAttributes(categoryId)

      expect(service.listCategoryCustomAttributes).toHaveBeenCalledWith({
        category_id: categoryId,
        deleted_at: null,
      })
      expect(result).toEqual(mockAttributes)
    })
  })

  describe('getAttributesByCategoryIds', () => {
    it('should query attributes for all provided category ids and mark inheritance', async () => {
      // categoryIds are provided in order [leaf, parent, grandparent]
      const categoryIds = ['leaf-cat', 'parent-cat', 'root-cat']

      const mockAttributes = [
        { id: 'a1', key: 'color', label: 'Color', type: 'text', category_id: 'leaf-cat', sort_order: 0 },
        { id: 'a2', key: 'weight', label: 'Weight', type: 'number', category_id: 'parent-cat', sort_order: 0 },
        { id: 'a3', key: 'brand', label: 'Brand', type: 'text', category_id: 'root-cat', sort_order: 0 },
      ]
      service.listCategoryCustomAttributes = jest.fn().mockResolvedValue(mockAttributes)

      const result = await service.getAttributesByCategoryIds(categoryIds)

      expect(service.listCategoryCustomAttributes).toHaveBeenCalledWith({
        category_id: categoryIds,
        deleted_at: null,
      })
      expect(result).toHaveLength(3)
      // First id in the list is the leaf category — its attributes are not inherited
      expect(result.find((a: any) => a.id === 'a1')).toMatchObject({ inherited: false, source_category_id: 'leaf-cat' })
      expect(result.find((a: any) => a.id === 'a2')).toMatchObject({ inherited: true, source_category_id: 'parent-cat' })
      expect(result.find((a: any) => a.id === 'a3')).toMatchObject({ inherited: true, source_category_id: 'root-cat' })
    })

    it('should return empty array when no category ids provided', async () => {
      service.listCategoryCustomAttributes = jest.fn()
      const result = await service.getAttributesByCategoryIds([])
      expect(result).toEqual([])
      expect(service.listCategoryCustomAttributes).not.toHaveBeenCalled()
    })
  })

  describe('createCategoryAttribute', () => {
    it('should create category attribute with generated key and defaults', async () => {
      const inputData = {
        label: 'Material Type',
        type: 'text',
        category_id: 'cat-123',
      }

      const mockResult = {
        id: 'attr-1',
        ...inputData,
        key: 'material_type',
        unit: null,
        is_standard: false,
        sort_order: 0,
      }

      service.createCategoryCustomAttributes = jest.fn().mockResolvedValue(mockResult)

      const result = await service.createCategoryAttribute(inputData)

      expect(service.createCategoryCustomAttributes).toHaveBeenCalledWith({
        ...inputData,
        key: 'material_type',
        unit: null,
        is_standard: false,
        sort_order: 0,
      })
      expect(result).toEqual(mockResult)
    })

    it('should use provided sort_order and is_standard values', async () => {
      const inputData = {
        label: 'Priority Attribute',
        type: 'number',
        category_id: 'cat-123',
        is_standard: true,
        sort_order: 10,
      }

      const mockResult = { ...inputData, key: 'priority_attribute' }
      service.createCategoryCustomAttributes = jest.fn().mockResolvedValue(mockResult)

      await service.createCategoryAttribute(inputData)

      expect(service.createCategoryCustomAttributes).toHaveBeenCalledWith({
        ...inputData,
        key: 'priority_attribute',
        unit: null,
        is_standard: true,
        sort_order: 10,
      })
    })
  })

  describe('updateCategoryAttribute', () => {
    it('should update attribute and regenerate key if label changes', async () => {
      const id = 'attr-123'
      const updateData = {
        label: 'New Label',
        type: 'text',
      }

      const mockResult = { id, ...updateData, key: 'new_label' }
      service.updateCategoryCustomAttributes = jest.fn().mockResolvedValue([mockResult])

      await service.updateCategoryAttribute(id, updateData)

      expect(service.updateCategoryCustomAttributes).toHaveBeenCalledWith([
        {
          id,
          ...updateData,
          key: 'new_label',
        },
      ])
    })

    it('should not regenerate key if label unchanged', async () => {
      const id = 'attr-123'
      const updateData = {
        type: 'number',
        sort_order: 5,
      }

      const mockResult = { id, ...updateData }
      service.updateCategoryCustomAttributes = jest.fn().mockResolvedValue([mockResult])

      await service.updateCategoryAttribute(id, updateData)

      expect(service.updateCategoryCustomAttributes).toHaveBeenCalledWith([
        { id, ...updateData },
      ])
    })
  })

  describe('getProductAttributes', () => {
    it('should call listProductCustomAttributes with product filter and relations', async () => {
      const productId = 'prod-123'
      const mockAttributes = [
        {
          id: '1',
          product_id: productId,
          value: 'Cotton',
          category_custom_attribute: { key: 'material', label: 'Material' },
        },
      ]

      service.listProductCustomAttributes = jest.fn().mockResolvedValue(mockAttributes)

      const result = await service.getProductAttributes(productId)

      expect(service.listProductCustomAttributes).toHaveBeenCalledWith(
        {
          product_id: productId,
          deleted_at: null,
        },
        {
          relations: ['category_custom_attribute'],
        }
      )
      expect(result).toEqual(mockAttributes)
    })
  })
})