const SPACE_REGEX = /\s/

// for QName validation as per http://www.w3.org/TR/REC-xml/#NT-NameChar
// | "-" | "." | [0-9] | #xB7 | [#x0300-#x036F] | [#x203F-#x2040]
const QNAME_REGEX = /^([a-z][\w-.]*:)?[a-z_][\w-.]*$/i

// for ID validation as per BPMN Schema (QName - Namespace)
const ID_REGEX = /^[a-z_][\w-.]*$/i

export function containsSpace(value: string) {
  return SPACE_REGEX.test(value)
}

export function validateId(idValue: string): string | undefined {
  if (containsSpace(idValue)) {
    return 'ID 不能包含空格'
  }

  if (!ID_REGEX.test(idValue)) {
    if (QNAME_REGEX.test(idValue)) {
      return 'ID 不能包含前缀(不能有 : 存在)'
    }

    return 'ID 必须以字母或者_作为开头，只能存在字母、数字、_ 和 -'
  }
}

export function idValidator(value?: string): string | undefined {
  if (!value) {
    return 'ID 不能为空'
  }

  return validateId(value)
}

export function isIdValid(elementBO: BpmnModdleEl, idValue: string): string | undefined {
  const simpleValid = validateId(idValue)

  if (simpleValid) {
    return simpleValid
  }

  const assigned = elementBO.$model.ids.assigned(idValue)
  const idAlreadyExists = assigned && assigned !== elementBO

  if (idAlreadyExists) {
    return 'ID 必须是唯一的'
  }
}
