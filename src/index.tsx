import '@webcomponents/webcomponentsjs/webcomponents-bundle';
import '@webcomponents/webcomponentsjs/custom-elements-es5-adapter';

import { registerReactTreeWebComponent } from './react-tree-web-component';

import React from 'react';

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
          {React.Children.map(
            children,
            (child, idx) =>
              React.isValidElement<{ isActive: boolean }>(child)
                ? React.cloneElement(child, { isActive: idx === step })
                : ''
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
      <fieldset style={{ display: isActive ? 'block' : 'none' }} {...props} />
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
      <label style={{ display: 'block' }}>
        {label}
        <input {...rest} />
      </label>
    );
  }

  static defaultProps = {
    label: ''
  };
}

const mapping: { [tagName: string]: React.ComponentType<any> } = {
  'x-step': Step,
  'x-input': Input,
  'x-form': Form
};

registerReactTreeWebComponent('react-tree', mapping);
