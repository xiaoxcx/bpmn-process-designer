import { rulesCache } from './lint-rules'

function Resolver() {}

Resolver.prototype.resolveRule = function (pkg: string, ruleName: string) {
  const rule = rulesCache[pkg + '/' + ruleName]

  if (!rule) {
    throw new Error('cannot resolve rule <' + pkg + '/' + ruleName + '>')
  }

  return rule
}

Resolver.prototype.resolveConfig = function (pkg: string, configName: string) {
  throw new Error('cannot resolve config <' + configName + '> in <' + pkg + '>')
}

export default Resolver
