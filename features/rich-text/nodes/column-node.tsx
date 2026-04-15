'use client';
import * as React from 'react';
import type { TColumnElement } from 'platejs';
import type { PlateElementProps } from 'platejs/react';
import { useDraggable, useDropLine } from '@platejs/dnd';
import { setColumns } from '@platejs/layout';
import { ResizableProvider } from '@platejs/resizable';
import { BlockSelectionPlugin } from '@platejs/selection/react';
import { useComposedRef } from '@udecode/cn';
import { PathApi } from 'platejs';
import {
    PlateElement,
    useEditorRef,
    useEditorSelector,
    useElement,
    useFocusedLast,
    usePluginOption,
    useReadOnly,
    useRemoveNodeButton,
    useSelected,
    withHOC,
} from 'platejs/react';
import { cn } from '@heroui/styles';
import { memo } from 'react';
import { Button, Tooltip } from '@heroui/react';
import { GripHorizontal } from '@gravity-ui/icons';

export const ColumnElement = withHOC(
    ResizableProvider,
    function ColumnElement(props: PlateElementProps<TColumnElement>) {
        const { width } = props.element;
        const readOnly = useReadOnly();
        const isSelectionAreaVisible = usePluginOption(
            BlockSelectionPlugin,
            'isSelectionAreaVisible'
        );

        const { isDragging, previewRef, handleRef } = useDraggable({
            element: props.element,
            orientation: 'horizontal',
            type: 'column',
            canDropNode: ({ dragEntry, dropEntry }) =>
                PathApi.equals(
                    PathApi.parent(dragEntry[1]),
                    PathApi.parent(dropEntry[1])
                ),
        });

        return (
            <div className="group/column relative " style={{ width: width ?? '100%' }}>
                {!readOnly && !isSelectionAreaVisible && (
                    <div
                        ref={handleRef}
                        className={cn(
                            '-translate-x-1/2 -translate-y-1/2 absolute top-2 left-1/2 z-50',
                            'pointer-events-auto flex items-center',
                            'opacity-0 transition-opacity group-hover/column:opacity-100'
                        )}
                    >
                        <ColumnDragHandle />
                    </div>

                )}
                <PlateElement
                    {...props}
                    ref={useComposedRef(props.ref, previewRef)}
                    className="h-full px-2 pt-2 group-first/column:pl-0 group-last/column:pr-0"
                >
                    <div
                        className={cn(
                            'relative h-full p-1.5 bg-surface-secondary',
                            !readOnly && 'rounded-lg border-border border-dashed',
                            isDragging && 'opacity-50'
                        )}
                    >
                        {props.children}
                        {!readOnly && !isSelectionAreaVisible && <DropLine />}
                    </div>
                </PlateElement>
            </div>
        )
    })



const ColumnDragHandle = memo(function ColumnDragHandle() {
    return (
        <Tooltip>
            <Button variant='ghost' isIconOnly>
                <GripHorizontal className='' onClick={(e) => { e.stopPropagation(); e.preventDefault() }} />
            </Button>
            <Tooltip.Content>
                Drag to move column
            </Tooltip.Content>
        </Tooltip>

    );
});


function DropLine() {
    const { dropLine } = useDropLine({ orientation: 'horizontal' });
    if (!dropLine) return null;
    return (
        <div
            className={cn(
                'slate-dropLine',
                'absolute bg-accent/50',
                dropLine === 'left' &&
                'group-first/column:-left-1 inset-y-0 left-[-10.5px] w-1',
                dropLine === 'right' &&
                'group-last/column:-right-1 inset-y-0 -right-2.75 w-1'
            )}
        />
    );
}


export function ColumnGroupElement(props: PlateElementProps) {
    return (
        <PlateElement className="mb-2" {...props}>
            <ColumnFloatingToolbar>
                {props.children}
            </ColumnFloatingToolbar>
        </PlateElement>
    );
}

function ColumnFloatingToolbar({ children }: React.PropsWithChildren) {
    const editor = useEditorRef();
    const readOnly = useReadOnly();
    const element = useElement<TColumnElement>();
    const { props: buttonProps } = useRemoveNodeButton({ element });
    const selected = useSelected();
    const isCollapsed = useEditorSelector(
        (editor) => editor.api.isCollapsed(),
        []
    );
    const isFocusedLast = useFocusedLast();

    const open = isFocusedLast && !readOnly && selected && isCollapsed;

    const onColumnChange = (widths: string[]) => {
        setColumns(editor, {
            at: element,
            widths,
        });
    };

    return (
        <>
            <Tooltip isOpen={open}>
                <Tooltip.Trigger className='w-full flex '>
                    {children}
                </Tooltip.Trigger>
                <Tooltip.Content>
                    asd
                </Tooltip.Content>
            </Tooltip>
        </>

    )
}