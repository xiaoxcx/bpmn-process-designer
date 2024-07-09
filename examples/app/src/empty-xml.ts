export default (key?: string): string => {
  key = 'abckey123456'
  const name = '测试流程'
  return `<?xml version="1.0" encoding="UTF-8"?>
<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:flowable="http://flowable.org/bpmn" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:omgdc="http://www.omg.org/spec/DD/20100524/DC" xmlns:omgdi="http://www.omg.org/spec/DD/20100524/DI" xmlns:xsd="http://www.w3.org/2001/XMLSchema" targetNamespace="http://flowable.org/bpmn">
  <process id="news_publish" name="新闻发布申请" isExecutable="true">
    <startEvent id="Event_izem4v3" flowable:initiator="initiator" />
    <userTask id="Activity_ov16gkg" name="发布新闻" flowable:assignee="\${initiator}" flowable:skipExpression="\${initiator==&#39;&#39;}">
      <extensionElements>
        <flowable:formData />
        <flowable:assigneeType>static</flowable:assigneeType>
      </extensionElements>
    </userTask>
    <sequenceFlow id="Flow_6vybcvj" sourceRef="Event_izem4v3" targetRef="Activity_ov16gkg" />
    <endEvent id="Event_0g56uop">
      <extensionElements>
        <flowable:executionListener delegateExpression="\${restExecutionBusinessCallListener}" event="end">
          <flowable:field name="requestUrl">
            <flowable:string>http://localhost:9999/portal/process/callback/updateDataStatus</flowable:string>
          </flowable:field>
        </flowable:executionListener>
      </extensionElements>
    </endEvent>
    <exclusiveGateway id="Gateway_0v9ktid" default="Flow_0l39l0y" />
    <sequenceFlow id="Flow_1c5sp21" sourceRef="Activity_ov16gkg" targetRef="Gateway_0v9ktid" />
    <userTask id="Activity_0ic5gay" name="信息处" flowable:candidateUsers="10000">
      <extensionElements>
        <flowable:formData />
        <flowable:assigneeType>idm</flowable:assigneeType>
        <flowable:idmCandidateUsers>[{"id":"1","name":"易烊千玺","code":"10000","sex":1,"mobile":"18689203258","companyId":"2","companyName":"北京市石化","deptId":"28","deptName":"人资部","value":"\${cuel.toList('10000')}"}]</flowable:idmCandidateUsers>
      </extensionElements>
    </userTask>
    <sequenceFlow id="Flow_0l39l0y" sourceRef="Gateway_0v9ktid" targetRef="Activity_0ic5gay" />
    <userTask id="Activity_0qh5rph" name="局管" flowable:candidateUsers="10000">
      <extensionElements>
        <flowable:formData />
        <flowable:assigneeType>idm</flowable:assigneeType>
        <flowable:idmCandidateUsers>[{"id":"1","name":"易烊千玺","code":"10000","sex":1,"mobile":"18689203258","companyId":"2","companyName":"北京市石化","deptId":"28","deptName":"人资部","value":"\${cuel.toList('10000')}"}]</flowable:idmCandidateUsers>
      </extensionElements>
    </userTask>
    <sequenceFlow id="Flow_1qr6k7g" sourceRef="Gateway_0v9ktid" targetRef="Activity_0qh5rph">
      <conditionExpression xsi:type="tFormalExpression">\${form.categorySn=='cz'}</conditionExpression>
    </sequenceFlow>
    <userTask id="Activity_17xdmax" name="审核员" flowable:candidateUsers="10000">
      <extensionElements>
        <flowable:formData />
        <flowable:assigneeType>idm</flowable:assigneeType>
        <flowable:idmCandidateUsers>[{"id":"1","name":"易烊千玺","code":"10000","sex":1,"mobile":"18689203258","companyId":"2","companyName":"北京市石化","deptId":"28","deptName":"人资部","value":"\${cuel.toList('10000')}"}]</flowable:idmCandidateUsers>
      </extensionElements>
    </userTask>
    <sequenceFlow id="Flow_1w5m36z" sourceRef="Activity_0ic5gay" targetRef="Activity_17xdmax" />
    <sequenceFlow id="Flow_0wqkd79" sourceRef="Activity_0qh5rph" targetRef="Activity_17xdmax" />
    <sequenceFlow id="Flow_0q155ii" sourceRef="Activity_17xdmax" targetRef="Event_0g56uop" />
  </process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_news_publish">
    <bpmndi:BPMNPlane id="BPMNPlane_news_publish" bpmnElement="news_publish">
      <bpmndi:BPMNShape id="BPMNShape_Event_izem4v3" bpmnElement="Event_izem4v3">
        <omgdc:Bounds x="0" y="25" width="30" height="30" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="BPMNShape_Activity_ov16gkg" bpmnElement="Activity_ov16gkg">
        <omgdc:Bounds x="80" y="0" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="BPMNShape_Event_0g56uop" bpmnElement="Event_0g56uop">
        <omgdc:Bounds x="672" y="22" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="BPMNShape_Gateway_0v9ktid" bpmnElement="Gateway_0v9ktid" isMarkerVisible="true">
        <omgdc:Bounds x="235" y="15" width="50" height="50" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="BPMNShape_Activity_0ic5gay" bpmnElement="Activity_0ic5gay">
        <omgdc:Bounds x="360" y="-90" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="BPMNShape_Activity_0qh5rph" bpmnElement="Activity_0qh5rph">
        <omgdc:Bounds x="360" y="80" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="BPMNShape_Activity_17xdmax" bpmnElement="Activity_17xdmax">
        <omgdc:Bounds x="500" y="0" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="BPMNEdge_Flow_6vybcvj" bpmnElement="Flow_6vybcvj">
        <omgdi:waypoint x="30" y="40" />
        <omgdi:waypoint x="42" y="40" />
        <omgdi:waypoint x="42" y="40" />
        <omgdi:waypoint x="80" y="40" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="BPMNEdge_Flow_1c5sp21" bpmnElement="Flow_1c5sp21">
        <omgdi:waypoint x="180" y="40" />
        <omgdi:waypoint x="235" y="40" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="BPMNEdge_Flow_0l39l0y" bpmnElement="Flow_0l39l0y">
        <omgdi:waypoint x="260" y="15" />
        <omgdi:waypoint x="260" y="-50" />
        <omgdi:waypoint x="360" y="-50" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="BPMNEdge_Flow_1qr6k7g" bpmnElement="Flow_1qr6k7g">
        <omgdi:waypoint x="260" y="65" />
        <omgdi:waypoint x="260" y="120" />
        <omgdi:waypoint x="360" y="120" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="BPMNEdge_Flow_1w5m36z" bpmnElement="Flow_1w5m36z">
        <omgdi:waypoint x="460" y="-50" />
        <omgdi:waypoint x="550" y="-50" />
        <omgdi:waypoint x="550" y="0" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="BPMNEdge_Flow_0wqkd79" bpmnElement="Flow_0wqkd79">
        <omgdi:waypoint x="460" y="120" />
        <omgdi:waypoint x="550" y="120" />
        <omgdi:waypoint x="550" y="80" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="BPMNEdge_Flow_0q155ii" bpmnElement="Flow_0q155ii">
        <omgdi:waypoint x="600" y="40" />
        <omgdi:waypoint x="672" y="40" />
      </bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</definitions>`
}
