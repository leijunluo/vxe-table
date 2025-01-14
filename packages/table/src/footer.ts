import { PropType, CreateElement } from 'vue'
import XEUtils from 'xe-utils'
import { VxeUI } from '../../ui'
import { getClass } from '../../ui/src/utils'
import { updateCellTitle } from '../../ui/src/dom'

import type { VxeTableDefines, VxeTableConstructor, VxeTablePrivateMethods, TableReactData, TableInternalData, VxeComponentStyleType } from '../../../types'

const renderType = 'footer'

const { renderer, renderEmptyElement } = VxeUI

function mergeFooterMethod (mergeFooterList: VxeTableDefines.MergeItem[], _rowIndex: number, _columnIndex: number) {
  for (let mIndex = 0; mIndex < mergeFooterList.length; mIndex++) {
    const { row: mergeRowIndex, col: mergeColIndex, rowspan: mergeRowspan, colspan: mergeColspan } = mergeFooterList[mIndex]
    if (mergeColIndex > -1 && mergeRowIndex > -1 && mergeRowspan && mergeColspan) {
      if (mergeRowIndex === _rowIndex && mergeColIndex === _columnIndex) {
        return { rowspan: mergeRowspan, colspan: mergeColspan }
      }
      if (_rowIndex >= mergeRowIndex && _rowIndex < mergeRowIndex + mergeRowspan && _columnIndex >= mergeColIndex && _columnIndex < mergeColIndex + mergeColspan) {
        return { rowspan: 0, colspan: 0 }
      }
    }
  }
}

function renderRows (h: CreateElement, _vm: any, tableColumn: VxeTableDefines.ColumnInfo[], footerTableData: any[], row: any, $rowIndex: number, _rowIndex: number) {
  const props = _vm
  const $xeTable = _vm.$parent as VxeTableConstructor & VxeTablePrivateMethods
  const tableProps = $xeTable
  const tableReactData = $xeTable as unknown as TableReactData
  const tableInternalData = $xeTable as unknown as TableInternalData

  const { fixedType } = props
  const { footerCellClassName, footerCellStyle, footerAlign: allFooterAlign, footerSpanMethod, align: allAlign, columnKey, showFooterOverflow: allColumnFooterOverflow } = tableProps
  const { scrollXLoad, scrollYLoad, overflowX, currentColumn, mergeFooterList } = tableReactData
  const { scrollXStore } = tableInternalData
  const tooltipOpts = $xeTable.computeTooltipOpts
  const columnOpts = $xeTable.computeColumnOpts

  return tableColumn.map((column: any, $columnIndex: any) => {
    const { type, showFooterOverflow, footerAlign, align, footerClassName, editRender, cellRender } = column
    const renderOpts = editRender || cellRender
    const compConf = renderOpts ? renderer.get(renderOpts.name) : null
    const showAllTip = tooltipOpts.showAll
    const isColGroup = column.children && column.children.length
    const fixedHiddenColumn = fixedType ? column.fixed !== fixedType && !isColGroup : column.fixed && overflowX
    const footOverflow = XEUtils.eqNull(showFooterOverflow) ? allColumnFooterOverflow : showFooterOverflow
    const footAlign = footerAlign || (compConf ? compConf.tableFooterCellAlign : '') || allFooterAlign || align || (compConf ? compConf.tableCellAlign : '') || allAlign
    let showEllipsis = footOverflow === 'ellipsis'
    const showTitle = footOverflow === 'title'
    const showTooltip = footOverflow === true || footOverflow === 'tooltip'
    let hasEllipsis = showTitle || showTooltip || showEllipsis
    const attrs: any = { colid: column.id }
    const tfOns: any = {}
    const columnIndex = $xeTable.getColumnIndex(column)
    const _columnIndex = $xeTable.getVTColumnIndex(column)
    const itemIndex = _columnIndex
    const cellParams: VxeTableDefines.CellRenderFooterParams = {
      $table: $xeTable,
      $grid: $xeTable.xegrid,
      row,
      rowIndex: _rowIndex,
      _rowIndex,
      $rowIndex,
      column,
      columnIndex,
      $columnIndex,
      _columnIndex,
      itemIndex,
      items: row,
      fixed: fixedType,
      type: renderType,
      data: footerTableData
    }
    // 纵向虚拟滚动不支持动态行高
    if (scrollXLoad && !hasEllipsis) {
      showEllipsis = hasEllipsis = true
    }
    if (showTitle || showTooltip || showAllTip) {
      tfOns.mouseenter = (evnt: MouseEvent) => {
        if (showTitle) {
          updateCellTitle(evnt.currentTarget, column)
        } else if (showTooltip || showAllTip) {
          $xeTable.triggerFooterTooltipEvent(evnt, cellParams)
        }
      }
    }
    if (showTooltip || showAllTip) {
      tfOns.mouseleave = (evnt: MouseEvent) => {
        if (showTooltip || showAllTip) {
          $xeTable.handleTargetLeaveEvent(evnt)
        }
      }
    }
    tfOns.click = (evnt: MouseEvent) => {
      $xeTable.dispatchEvent('footer-cell-click', Object.assign({ cell: evnt.currentTarget }, cellParams), evnt)
    }
    tfOns.dblclick = (evnt: MouseEvent) => {
      $xeTable.dispatchEvent('footer-cell-dblclick', Object.assign({ cell: evnt.currentTarget }, cellParams), evnt)
    }
    // 合并行或列
    if (mergeFooterList.length) {
      const spanRest = mergeFooterMethod(mergeFooterList, _rowIndex, _columnIndex)
      if (spanRest) {
        const { rowspan, colspan } = spanRest
        if (!rowspan || !colspan) {
          return null
        }
        if (rowspan > 1) {
          attrs.rowspan = rowspan
        }
        if (colspan > 1) {
          attrs.colspan = colspan
        }
      }
    } else if (footerSpanMethod) {
      // 自定义合并方法
      const { rowspan = 1, colspan = 1 } = footerSpanMethod(cellParams) || {}
      if (!rowspan || !colspan) {
        return null
      }
      if (rowspan > 1) {
        attrs.rowspan = rowspan
      }
      if (colspan > 1) {
        attrs.colspan = colspan
      }
    }
    const isLastColumn = $columnIndex === tableColumn.length - 1
    const isAutoCellWidth = !column.resizeWidth && (column.minWidth === 'auto' || column.width === 'auto')

    let isVNPreEmptyStatus = false
    if (scrollXLoad && !column.fixed && (_columnIndex < scrollXStore.visibleStartIndex - scrollXStore.preloadSize || _columnIndex > scrollXStore.visibleEndIndex + scrollXStore.preloadSize)) {
      isVNPreEmptyStatus = true
    }

    return h('td', {
      class: ['vxe-footer--column', column.id, {
        [`col--${footAlign}`]: footAlign,
        [`col--${type}`]: type,
        'col--last': isLastColumn,
        'fixed--width': !isAutoCellWidth,
        'fixed--hidden': fixedHiddenColumn,
        'col--ellipsis': hasEllipsis,
        'col--current': currentColumn === column
      }, getClass(footerClassName, cellParams), getClass(footerCellClassName, cellParams)],
      attrs,
      style: footerCellStyle ? (XEUtils.isFunction(footerCellStyle) ? footerCellStyle(cellParams) : footerCellStyle) as VxeComponentStyleType : undefined,
      on: tfOns,
      key: columnKey || scrollXLoad || scrollYLoad || columnOpts.useKey || columnOpts.drag ? column.id : $columnIndex
    }, [
      h('div', {
        class: ['vxe-cell', {
          'c--title': showTitle,
          'c--tooltip': showTooltip,
          'c--ellipsis': showEllipsis
        }]
      }, isVNPreEmptyStatus ? [] : column.renderFooter(h, cellParams))
    ])
  })
}

function renderHeads (h: CreateElement, _vm: any, renderColumnList: VxeTableDefines.ColumnInfo[]) {
  const props = _vm
  const $xeTable = _vm.$parent as VxeTableConstructor & VxeTablePrivateMethods
  const tableProps = $xeTable
  const tableReactData = $xeTable as unknown as TableReactData

  const { fixedType, footerTableData } = props

  const { footerRowClassName, footerRowStyle } = tableProps
  const { isDragColMove } = tableReactData
  const columnOpts = $xeTable.computeColumnOpts
  const columnDragOpts = $xeTable.computeColumnDragOpts

  return (footerTableData as any[][]).map((row, $rowIndex) => {
    const _rowIndex = $rowIndex
    const rowParams = { $table: $xeTable, row, _rowIndex, $rowIndex, fixed: fixedType, type: renderType }

    if (columnOpts.drag && columnDragOpts.animation) {
      return h('transition-group', {
        key: $rowIndex,
        props: {
          tag: 'tr',
          name: `vxe-header--col-list${isDragColMove ? '' : '-disabled'}`,
          class: [
            'vxe-footer--row',
            footerRowClassName ? XEUtils.isFunction(footerRowClassName) ? footerRowClassName(rowParams) : footerRowClassName : ''
          ],
          style: footerRowStyle ? (XEUtils.isFunction(footerRowStyle) ? footerRowStyle(rowParams) : footerRowStyle) as VxeComponentStyleType : undefined
        }
      }, renderRows(h, _vm, renderColumnList, footerTableData, row, $rowIndex, _rowIndex))
    }
    return h('tr', {
      key: $rowIndex,
      class: [
        'vxe-footer--row',
        footerRowClassName ? XEUtils.isFunction(footerRowClassName) ? footerRowClassName(rowParams) : footerRowClassName : ''
      ],
      style: footerRowStyle ? (XEUtils.isFunction(footerRowStyle) ? footerRowStyle(rowParams) : footerRowStyle) as VxeComponentStyleType : undefined
    }, renderRows(h, _vm, renderColumnList, footerTableData, row, $rowIndex, _rowIndex))
  })
}

export default {
  name: 'VxeTableFooter',
  props: {
    footerTableData: {
      type: Array as PropType<any[][]>,
      default: () => []
    },
    tableColumn: {
      type: Array as PropType<VxeTableDefines.ColumnInfo[]>,
      default: () => []
    },
    fixedColumn: {
      type: Array as PropType<VxeTableDefines.ColumnInfo[]>,
      default: () => []
    },
    fixedType: {
      type: String as PropType<'right' | 'left' | ''>,
      default: null
    }
  },
  mounted (this: any) {
    const _vm = this
    const props = _vm
    const $xeTable = _vm.$parent as VxeTableConstructor & VxeTablePrivateMethods
    const tableInternalData = $xeTable as unknown as TableInternalData

    const { fixedType } = props
    const { elemStore } = tableInternalData
    const prefix = `${fixedType || 'main'}-footer-`
    elemStore[`${prefix}wrapper`] = _vm.$refs.refElem
    elemStore[`${prefix}scroll`] = _vm.$refs.refFooterScroll
    elemStore[`${prefix}table`] = _vm.$refs.refFooterTable
    elemStore[`${prefix}colgroup`] = _vm.$refs.refFooterColgroup
    elemStore[`${prefix}list`] = _vm.$refs.refFooterTFoot
    elemStore[`${prefix}xSpace`] = _vm.$refs.refFooterXSpace
  },
  destroyed () {
    const props = this
    const $xeTable = this.$parent as VxeTableConstructor & VxeTablePrivateMethods
    const tableInternalData = $xeTable as unknown as TableInternalData

    const { fixedType } = props
    const { elemStore } = tableInternalData
    const prefix = `${fixedType || 'main'}-footer-`
    elemStore[`${prefix}wrapper`] = null
    elemStore[`${prefix}scroll`] = null
    elemStore[`${prefix}table`] = null
    elemStore[`${prefix}colgroup`] = null
    elemStore[`${prefix}list`] = null
    elemStore[`${prefix}xSpace`] = null
  },
  render (h: CreateElement) {
    const props = this
    const $xeTable = this.$parent as VxeTableConstructor & VxeTablePrivateMethods
    const tableProps = $xeTable
    const tableReactData = $xeTable as unknown as TableReactData
    const tableInternalData = $xeTable as unknown as TableInternalData

    const { xID } = $xeTable

    const { fixedType, fixedColumn, tableColumn } = props
    const { spanMethod, footerSpanMethod, showFooterOverflow: allColumnFooterOverflow } = tableProps
    const { visibleColumn, fullColumnIdData } = tableInternalData
    const { isGroup, scrollXLoad, scrollYLoad, dragCol } = tableReactData

    let renderColumnList = tableColumn as VxeTableDefines.ColumnInfo[]
    let isOptimizeMode = false
    // 如果是使用优化模式
    if (scrollXLoad || scrollYLoad || allColumnFooterOverflow) {
      if (spanMethod || footerSpanMethod) {
        // 如果不支持优化模式
      } else {
        isOptimizeMode = true
      }
    }

    if (fixedType) {
      renderColumnList = visibleColumn
      if (isOptimizeMode) {
        renderColumnList = fixedColumn || []
      }
    }

    if (!fixedType && !isGroup) {
      // 列拖拽
      if (scrollXLoad && dragCol) {
        if (renderColumnList.length > 2) {
          const dCowRest = fullColumnIdData[dragCol.id]
          if (dCowRest) {
            const dcIndex = dCowRest._index
            const firstCol = renderColumnList[0]
            const lastCol = renderColumnList[renderColumnList.length - 1]
            const firstColRest = fullColumnIdData[firstCol.id]
            const lastColRest = fullColumnIdData[lastCol.id]
            if (firstColRest && lastColRest) {
              const fcIndex = firstColRest._index
              const lcIndex = lastColRest._index
              if (dcIndex < fcIndex) {
                renderColumnList = [dragCol].concat(renderColumnList)
              } else if (dcIndex > lcIndex) {
                renderColumnList = renderColumnList.concat([dragCol])
              }
            }
          }
        }
      }
    }

    return h('div', {
      ref: 'refElem',
      class: ['vxe-table--footer-wrapper', fixedType ? `fixed-${fixedType}--wrapper` : 'body--wrapper'],
      attrs: {
        xid: xID
      }
    }, [
      h('div', {
        ref: 'refFooterScroll',
        class: 'vxe-table--footer-inner-wrapper',
        on: {
          scroll (evnt: Event) {
            $xeTable.triggerFooterScrollEvent(evnt, fixedType)
          }
        }
      }, [
        fixedType
          ? renderEmptyElement($xeTable)
          : h('div', {
            ref: 'refFooterXSpace',
            class: 'vxe-body--x-space'
          }),
        h('table', {
          ref: 'refFooterTable',
          class: 'vxe-table--footer',
          attrs: {
            xid: xID,
            cellspacing: 0,
            cellpadding: 0,
            border: 0
          }
        }, [
        /**
         * 列宽
         */
          h('colgroup', {
            ref: 'refFooterColgroup'
          }, renderColumnList.map((column, $columnIndex) => {
            return h('col', {
              attrs: {
                name: column.id
              },
              key: $columnIndex
            })
          })),
          /**
         * 底部
         */
          h('tfoot', {
            ref: 'refFooterTFoot'
          }, renderHeads(h, this, renderColumnList))
        ])
      ])
    ])
  }
} as any
