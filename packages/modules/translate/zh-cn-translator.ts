import bpmnZh from 'bpmn-js-i18n-zh/lib/bpmn-js'
import externalElements from './resources'

export default function (template: string, replacements?: Record<string, string>) {
  replacements = replacements || {}

  // Translate
  template = externalElements[template] || bpmnZh[template] || template

  // Replace
  return template.replace(/{([^}]+)}/g, function (_, key) {
    return replacements![key] || '{' + key + '}'
  })
}
