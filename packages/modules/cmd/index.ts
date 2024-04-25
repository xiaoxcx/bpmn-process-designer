import CommandInitializer from './CommandInitializer'
import MultiCommandInterceptor from './MultiCommandInterceptor'

const CustomCmd = {
  __init__: ['commandInitializer', 'multiCommandInterceptor'],
  commandInitializer: ['type', CommandInitializer],
  multiCommandInterceptor: ['type', MultiCommandInterceptor]
}
export default CustomCmd
