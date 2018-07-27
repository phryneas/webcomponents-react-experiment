import "@webcomponents/webcomponentsjs/webcomponents-bundle";
import "@webcomponents/webcomponentsjs/custom-elements-es5-adapter";

import retargetEvents from 'react-shadow-dom-retarget-events';
import debounce from "lodash.debounce";

import ReactDOM from "react-dom";
import React from "react";

class Form extends React.Component<{ name: string }, { step: number }> {
  public state = { step: 0 };

  private nextStep = () => this.setState(({ step }) => ({ step: step + 1 }));
  private prevStep = () => this.setState(({ step }) => ({ step: step - 1 }));

  render() {
    const { name, children, ...props } = this.props;
    const { step } = this.state;
    return (
      <>
        <h1>{name}</h1>
        <form {...props}>
          {React.Children.map(children, (child, idx) =>
            React.isValidElement<{isActive: boolean}>(child) ? React.cloneElement(child, { isActive: idx === step }) : ''
          )}
        </form>
        <button onClick={this.prevStep}>&lt;</button>
        <button onClick={this.nextStep}>&gt;</button>
      </>
    );
  }
}

class Step extends React.Component<{ isActive: boolean }> {
  render() {
    const { isActive, ...props } = this.props;
    return (
      <fieldset
        style={{ display: isActive ? "block" : "none" }}
        {...props}
      />
    );
  }
}

class Input extends React.Component<
  { label: string } & React.DetailedHTMLProps<
    React.InputHTMLAttributes<HTMLInputElement>,
    HTMLInputElement
  >
> {
  render() {
    const { label, ...rest } = this.props;
    return (
      <label style={{ display: "block" }}>
        {label}
        <input {...rest} />
      </label>
    );
  }

  static defaultProps = {
    label: ""
  };
}

const mapping: { [tagName: string]: React.ComponentType<any> } = {
  "x-step": Step,
  "x-input": Input,
  "x-form": Form
};

const isElement = (n: Node): n is Element => n.nodeType === Node.ELEMENT_NODE;
const isText = (n: Node): n is Text => n.nodeType === Node.TEXT_NODE;

const iterate = (node: Node, idx: number = 0): React.ReactNode => {
  if (isText(node)) {
    if (!node.textContent || node.textContent.trim() === '') {
      return null;
    }
    return <React.Fragment key={idx}>{node.textContent}</React.Fragment>;
  }
  
  if (!isElement(node)) {
    return null;
  }

  const Mapped = mapping[node.tagName.toLowerCase()];
  if (!Mapped) {
    return null;
  }

  const props: { [attrName: string]: any } = !node.hasAttributes()
    ? {}
    : Array.from(node.attributes).reduce<{ [attrName: string]: any }>(
        (acc, { name, value }) => {
          acc[name] = value;
          return acc;
        },
        {}
      );
  const children = Array.from(node.childNodes).map(iterate).filter(x => !!x);

  return (
    <Mapped
      key={idx}
      {...props}
      children={children.length > 0 ? children : undefined}
    />
  );
};

class XForm extends HTMLElement {
  connectedCallback() {
    const shadowRoot = this.attachShadow({ mode: "open" });
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
    ReactDOM.render(<>{iterate(this)}</>, this.mountPoint);
  }, 10);

  private mountPoint = document.createElement("span");
  private observer = new MutationObserver(mutations => {
    this.render();
  });
}

customElements.define("x-form", XForm);
