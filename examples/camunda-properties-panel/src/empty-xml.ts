export default (key?: string): string => {
  key = 'abckey123456'
  const name = '测试流程'
  return `<?xml version="1.0" encoding="UTF-8"?>
<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:omgdc="http://www.omg.org/spec/DD/20100524/DC" xmlns:omgdi="http://www.omg.org/spec/DD/20100524/DI" xmlns:xsd="http://www.w3.org/2001/XMLSchema" targetNamespace="http://flowable.org/bpmn">
  <process id="news_publish" name="新闻发布申请" isExecutable="true">
  </process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_news_publish">
    <bpmndi:BPMNPlane id="BPMNPlane_news_publish" bpmnElement="news_publish">
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</definitions>`
}
