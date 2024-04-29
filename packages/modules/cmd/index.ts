import CommandInitializer from './command-initializer'
import MultiCommandInterceptor from './multi-command-interceptor'

const CustomCmd = {
  __init__: ['commandInitializer', 'multiCommandInterceptor'],
  commandInitializer: ['type', CommandInitializer],
  multiCommandInterceptor: ['type', MultiCommandInterceptor]
}
export default CustomCmd
