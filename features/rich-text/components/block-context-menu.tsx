'use client';
import * as React from 'react';
import {
    BlockMenuPlugin,
  BlockSelectionPlugin,
} from '@platejs/selection/react';
import {
  useEditorPlugin,
  useEditorReadOnly,
} from 'platejs/react';

import { useIsTouchDevice } from '@/hooks/use-is-touch-device';
import { Dropdown } from '@heroui/react';

export function BlockContextMenu({ children }: { children: React.ReactNode }) {
  const { api, editor } = useEditorPlugin(BlockMenuPlugin);
  const readOnly = useEditorReadOnly();
  const isTouch = useIsTouchDevice();

  // ✅ 必须补：状态
  const [open, setOpen] = React.useState(false);
  const [position, setPosition] = React.useState({ x: 0, y: 0 });

  // ✅ 点击外部关闭
  React.useEffect(() => {
    if (!open) return;

    const handleClick = () => setOpen(false);
    window.addEventListener('click', handleClick);

    return () => window.removeEventListener('click', handleClick);
  }, [open]);

  if (isTouch) {
    return children;
  }

  return (
    <>
      {/* ✅ 右键监听 */}
      <div
        className="w-full"
        onContextMenu={(e) => {
          if (readOnly) return;

          e.preventDefault();

          setPosition({
            x: e.clientX,
            y: e.clientY,
          });

          setOpen(true);
        }}
      >
        {children}
      </div>

      {/* ✅ 浮层 */}
      {open && (
        <div
          className="fixed z-50"
          style={{
            top: Math.min(position.y, window.innerHeight - 200),
            left: Math.min(position.x, window.innerWidth - 220),
          }}
        >
          <Dropdown
            isOpen={open}
            onOpenChange={(v) => {
              if (!v) setOpen(false);
            }}
          >
            {/* ⚠️ 必须存在，否则 HeroUI 报错 */}
            <Dropdown.Trigger>
              <span />
            </Dropdown.Trigger>

            <Dropdown.Popover>
              <Dropdown.Menu
                aria-label="Block actions"
                onAction={(key) => {
                  switch (key) {
                    case 'askAI': {
                      // 👉 这里你可以接 AIChatPlugin
                      console.log('Ask AI');
                      break;
                    }

                    case 'duplicate': {
                      editor
                        .getTransforms(BlockSelectionPlugin)
                        .blockSelection.duplicate();
                      break;
                    }

                    case 'delete': {
                      editor
                        .getTransforms(BlockSelectionPlugin)
                        .blockSelection.removeNodes();
                      break;
                    }
                  }

                  setOpen(false);
                }}
              >
                <Dropdown.Item key="askAI">
                  Ask AI
                </Dropdown.Item>

                <Dropdown.Item key="duplicate">
                  Duplicate
                </Dropdown.Item>

                <Dropdown.Item key="delete" className="text-danger">
                  Delete
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown>
        </div>
      )}
    </>
  );
}