import GlobalConfig from './conf'
import XEUtils from 'xe-utils'

import { VxeGlobalConfigMethod } from '../../../types/all'

/**
 * 全局参数设置
 */
export const config: VxeGlobalConfigMethod = (options) => {
  return XEUtils.merge(GlobalConfig, options)
}
