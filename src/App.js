import React, { useState } from 'react';
import { parse } from 'acorn';
import './App.css';

class Node {
  constructor(value) {
    this.value = value;
    this.next = null;
    this.down = null;
  }
}

class LinkedList {
  constructor() {
    this.head = null;
  }

  insertVariableAndExpression(variable, condition, value) {
    const variableNode = new Node(variable);
    const conditionNode = new Node(condition);
    const valueNode = new Node(value);

    variableNode.down = conditionNode;
    conditionNode.down = valueNode;

    if (!this.head) {
      this.head = variableNode;
    } else {
      let current = this.head;
      while (current.next) {
        current = current.next;
      }
      current.next = variableNode;
    }
  }

  addExpression(existingVariableNode, condition, value) {
    const conditionNode = new Node(condition);
    const valueNode = new Node(value);

    let current = existingVariableNode;
    while (current.down) {
      current = current.down;
    }

    current.down = conditionNode;
    conditionNode.down = valueNode;
  }

  findVariable(variable) {
    let current = this.head;
    while (current) {
      if (current.value === variable) {
        return current;
      }
      current = current.next;
    }
    return null;
  }

  processDataEntry({ variable, condition, value }) {
    const existingVariableNode = this.findVariable(variable);

    if (!existingVariableNode) {
      this.insertVariableAndExpression(variable, condition, value);
    } else {
      this.addExpression(existingVariableNode, condition, value);
    }
  }

  display() {
    let result = '';
    let currentVariable = this.head;

    while (currentVariable) {
      let current = currentVariable;
      while (current) {
        result += `${current.value} -> `;
        current = current.down;
      }
      result += "null\n|\n";
      currentVariable = currentVariable.next;
    }
    result += "null";
    console.log(result);
    
  }
}

class TestCaseNode {
  constructor(value) {
    this.value = value;
    this.next = null;
    this.down = null;
  }
}

class TestCaseLinkedList {
  constructor() {
    this.head = null;
  }

  insertTestCase(variable, condition, value) {
    const testCaseNode = new TestCaseNode(variable);
    const conditionNode = new Node(condition);
    const valueNode = new Node(generateTestCaseValue(condition, value));
    const valueNode1 = new Node(value);

    testCaseNode.down = valueNode;
    valueNode.down = valueNode1;

    if (!this.head) {
      this.head = testCaseNode;
    } else {
      let current = this.head;
      while (current.next) {
        current = current.next;
      }
      current.next = testCaseNode;
    }
  }

  findTestCase(variable) {
    let current = this.head;
    while (current) {
      if (current.value === variable) {
        return current;
      }
      current = current.next;
    }
    return null;
  }

  addTestForVariable(existingTestCase, condition, value) {
    let current = existingTestCase.down;
    let found = false;

    while (current.down) {
      if (isNaN(value)) {
        if (condition === '==') {
          if (current.value == "not_" + value) {
            found = true;
            break;
          }
        } else if (condition === '!=') {
          if (current.value != "not_" + value) {
            found = true;
            break;
          }
        }
      }
      if (condition === '==') {
        if (current.value == value) {
          found = true;
          break;
        }
      } else if (condition === '!=') {
        if (current.value != value) {
          found = true;
          break;
        }
      } else if (condition === '<') {
        if (current.value < value) {
          found = true;
          break;
        }
      } else if (condition === '>') {
        if (current.value > value) {
          found = true;
          break;
        }
      } else if (condition === '<=') {
        if (current.value <= value) {
          found = true;
          break;
        }
      } else if (condition === '>=') {
        if (current.value >= value) {
          found = true;
          break;
        }
      }

      current = current.down;
    }

    if (!found) {
      const conditionNode = new Node(condition);
      const valueNode = new Node(generateTestCaseValue(condition, value));
      const valueNode1 = new Node(value);

      current.down = valueNode;
      valueNode.down = valueNode1;
    } else {
      const conditionNode = new Node(condition);
      const valueNode1 = new Node(value);

      while (current.down) {
        current = current.down;
      }
      current.down = valueNode1;
    }
  }

  generateTestCasesForDataEntry(data) {
    const { variable, condition, value } = data;
    const existingTestCase = this.findTestCase(variable);

    if (!existingTestCase) {
      this.insertTestCase(variable, condition, value);
    } else {
      this.addTestForVariable(existingTestCase, condition, value);
    }
  }

  display() {
    let result = '';
    let currentTestCase = this.head;

    while (currentTestCase) {
      let current = currentTestCase;
      while (current) {
        result += `${current.value} -> `;
        current = current.down;
      }
      result += "null\n|\n";
      currentTestCase = currentTestCase.next;
    }
    result += "null";
    console.log(result);
    return result;
  }
}

function generateTestCaseValue(condition, value) {
  if (isNaN(value)) {
    return 'not_' + value;
  }

  if (condition === '==') {
    return (parseInt(value) + 1).toString();
  } else if (condition === '!=') {
    return (parseInt(value) + 1).toString();
  } else if (condition === '<') {
    return (parseInt(value) - 1).toString();
  } else if (condition === '>') {
    return (parseInt(value) + 1).toString();
  } else if (condition === '<=') {
    return (parseInt(value) + 1).toString();
  } else if (condition === '>=') {
    return (parseInt(value) - 1).toString();
  }

  return value;
}

const App = () => {
  const [testcases , setTestCases] = useState(null);
  const [code, setCode] = useState('');
  const [coverageResults, setCoverageResults] = useState(null);

  // Move the linkedList and testCaseLinkedList declarations outside the function
  const linkedList = new LinkedList();
  const testCaseLinkedList = new TestCaseLinkedList();

  const handleCodeChange = (event) => {
    setCode(event.target.value);
  };

  
  const handleGenerateTestCases = () => {
    const ast = parse(code, { locations: true, ecmaVersion: 'latest' });
    const variables = {};
    traverseAST(ast, (node) => {
      if (node.type === 'VariableDeclarator' && node.id && node.id.name) {
        variables[node.id.name] = evaluateLiteral(node.init);
      }
    });

    for (const variable in variables) {
      const value = variables[variable];
      linkedList.processDataEntry({ variable, condition: '==', value });
      testCaseLinkedList.generateTestCasesForDataEntry({ variable, condition: '==', value });
    }

    setCoverageResults(
      `Variables:\n${JSON.stringify(variables, null, 2)}\n\nGenerated Test Cases:\n${testCaseLinkedList.display()}`
    
    );

    setTestCases(testCaseLinkedList.display());
  };

  const evaluateLiteral = (node) => {
    if (node && node.type === 'Literal') {
      return node.value;
    }
    return undefined;
  };

  const traverseAST = (node, callback) => {
    callback(node);
    for (const key in node) {
      if (node[key] && typeof node[key] === 'object') {
        traverseAST(node[key], callback);
      }
    }
  };

  return (
    <div>
      <h1>JavaScript Code Analyzer</h1>
      <div>
        <label htmlFor="code">Enter your JavaScript code:</label>
        <textarea
          id="code"
          value={code}
          onChange={handleCodeChange}
          placeholder="Type your JavaScript code here..."
        />
      </div>
      <div>
        <button onClick={handleGenerateTestCases}>Generate Test Cases</button>
      </div>
      {coverageResults && (
        <div>
          <h2>Code Coverage Results</h2>
          <pre>{coverageResults}</pre>
        </div>
      )}
    </div>
  );
};

export default App;
