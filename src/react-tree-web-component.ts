import React from 'react';
import ReactDOM from 'react-dom';

import retargetEvents from 'react-shadow-dom-retarget-events';
import debounce from 'lodash.debounce';

const isElement = (n: Node): n is Element => n.nodeType === Node.ELEMENT_NODE;
const isText = (n: Node): n is Text => n.nodeType === Node.TEXT_NODE;

export interface ComponentMapping {
  [tagName: string]: React.ComponentType<any>;
}

export function registerReactTreeWebComponent(
  tagName: string,
  mapping: ComponentMapping
) {
  const iterate = (node: Node, idx: number = 0): React.ReactNode => {
    const baseProps = { key: idx };

    if (isText(node)) {
      if (!node.textContent || node.textContent.trim() === '') {
        return null;
      }
      return React.createElement(React.Fragment, baseProps, node.textContent);
    }

    if (!isElement(node)) {
      return null;
    }

    const props: { [attrName: string]: any } = !node.hasAttributes()
      ? baseProps
      : Array.from(node.attributes).reduce<{ [attrName: string]: any }>(
          (acc, { name, value }) => {
            acc[name] = value;
            return acc;
          },
          baseProps
        );

    const children = Array.from(node.childNodes)
      .map(iterate)
      .filter(x => !!x);

    return React.createElement(
      mapping[node.tagName.toLowerCase()] || node.tagName.toLowerCase(),
      props,
      ...children
    );
  };

  class ReactTreeComponent extends HTMLElement {
    connectedCallback() {
      const shadowRoot = this.attachShadow({ mode: 'closed' });
      shadowRoot.appendChild(this.mountPoint);
      retargetEvents(shadowRoot);

      var config = {
        attributes: true,
        childList: true,
        characterData: true,
        subtree: true
      };
      this.observer.observe(this, config);

      this.render();
    }

    private render = debounce(() => {
      const children = Array.from(this.childNodes)
        .map(iterate)
        .filter(x => !!x);
      ReactDOM.render(
        React.createElement(React.Fragment, {}, children),
        this.mountPoint
      );
    }, 10);

    private mountPoint = document.createElement('div');
    private observer = new MutationObserver(mutations => {
      this.render();
    });
  }

  customElements.define(tagName, ReactTreeComponent);
}
