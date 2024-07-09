import GlobalConfig from '../../v-x-e-table/src/conf'
import VXETable from '../../v-x-e-table'
import { isEnableConf, getFuncText } from '../../tools/utils'
import { getSlotVNs } from '../../tools/vn'

function renderPrefixIcon (h, titlePrefix) {
  return h('span', {
    class: 'vxe-form--item-title-prefix'
  }, [
    h('i', {
      class: titlePrefix.icon || GlobalConfig.icon.FORM_PREFIX
    })
  ])
}

function renderSuffixIcon (h, titleSuffix) {
  return h('span', {
    class: 'vxe-form--item-title-suffix'
  }, [
    h('i', {
      class: titleSuffix.icon || GlobalConfig.icon.FORM_SUFFIX
    })
  ])
}

export function renderTitle (h, _vm, item) {
  const { data, readonly, disabled, tooltipOpts } = _vm
  const { slots, field, itemRender, titlePrefix, titleSuffix } = item
  const compConf = isEnableConf(itemRender) ? VXETable.renderer.get(itemRender.name) : null
  const params = { data, readonly, disabled, field, property: field, item, $form: _vm, $grid: _vm.xegrid }
  const contVNs = []
  const titVNs = []
  if (titlePrefix) {
    titVNs.push(
      (titlePrefix.content || titlePrefix.message)
        ? h('vxe-tooltip', {
          props: {
            ...tooltipOpts,
            ...titlePrefix,
            content: getFuncText(titlePrefix.content || titlePrefix.message)
          }
        }, [
          renderPrefixIcon(h, titlePrefix)
        ])
        : renderPrefixIcon(h, titlePrefix)
    )
  }
  const rfiTitle = compConf ? (compConf.renderFormItemTitle || compConf.renderItemTitle) : null
  titVNs.push(
    h('span', {
      class: 'vxe-form--item-title-label'
    }, rfiTitle ? getSlotVNs(rfiTitle(itemRender, params)) : (slots && slots.title ? _vm.callSlot(slots.title, params, h) : getFuncText(item.title)))
  )
  contVNs.push(
    h('div', {
      class: 'vxe-form--item-title-content'
    }, titVNs)
  )
  const fixVNs = []
  if (titleSuffix) {
    fixVNs.push(
      (titleSuffix.content || titleSuffix.message)
        ? h('vxe-tooltip', {
          props: {
            ...tooltipOpts,
            ...titlePrefix,
            content: getFuncText(titleSuffix.content || titleSuffix.message)
          }
        }, [
          renderSuffixIcon(h, titleSuffix)
        ])
        : renderSuffixIcon(h, titleSuffix)
    )
  }
  contVNs.push(
    h('div', {
      class: 'vxe-form--item-title-postfix'
    }, fixVNs)
  )
  return contVNs
}
