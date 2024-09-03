import './App.css'
import {useEffect} from "react";
import Modeler from "bpmn-js/lib/Modeler";
import {
  BpmnPropertiesPanelModule,
  BpmnPropertiesProviderModule,
} from 'bpmn-js-properties-panel';

function App() {
  let modeler: Modeler

  function initModeler() {
    if (modeler) return
    modeler = new Modeler({
      container: '#designer',
      propertiesPanel: {
        parent: '#panel'
      },
      additionalModules: [
        BpmnPropertiesPanelModule,
        BpmnPropertiesProviderModule
      ]
    })
  }

  useEffect(() => {
    initModeler()
  }, []);


  return (
    <>
      <div className='designer' id="designer"></div>
      <div className='panel' id="panel"></div>
    </>
  )
}

export default App
