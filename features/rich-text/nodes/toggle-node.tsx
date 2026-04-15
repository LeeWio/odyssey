"use client";
import * as React from "react";
import type { PlateElementProps } from "platejs/react";
import { useToggleButton, useToggleButtonState } from "@platejs/toggle/react";
import { PlateElement } from "platejs/react";
import { Button } from "@heroui/react";
import { Check } from "@gravity-ui/icons";

export function ToggleElement(props: PlateElementProps) {
  const element = props.element;
  const state = useToggleButtonState(element.id as string);
  const { buttonProps, open } = useToggleButton(state);

  return (
    <PlateElement {...props} className="accordion accordion__heading accordion__trigger pl-6">
      {/* <button
                className="-left-0.5 absolute top-0 size-6 cursor-pointer select-none items-center justify-center rounded-md p-px text-muted-foreground transition-colors hover:bg-accent [&_svg]:size-4"
                contentEditable={false}
                {...buttonProps}
            >
                <Check
                    className={
                        open
                            ? 'rotate-90 transition-transform duration-75'
                            : 'rotate-0 transition-transform duration-75'
                    }
                />
            </button> */}
      {props.children}
    </PlateElement>
  );
}

{
  /* <Accordion className="w-full max-w-md">
      {items.map((item, index) => (
        <Accordion.Item key={index}>
          <Accordion.Heading>
            <Accordion.Trigger>
              {item.icon ? (
                <span className="mr-3 size-4 shrink-0 text-muted">{item.icon}</span>
              ) : null}
              {item.title}
              <Accordion.Indicator>
                <ChevronDown />
              </Accordion.Indicator>
            </Accordion.Trigger>
          </Accordion.Heading>
          <Accordion.Panel>
            <Accordion.Body>{item.content}</Accordion.Body>
          </Accordion.Panel>
        </Accordion.Item>
      ))}
    </Accordion> */
}
