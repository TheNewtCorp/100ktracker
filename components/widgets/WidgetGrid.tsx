import React from 'react';
import { WidgetContainer } from './WidgetContainer';
import { Widget, WidgetSettings } from '../../types/widget';

interface WidgetGridProps {
  widgets: Widget[];
  settings: WidgetSettings[];
  onSettingsChange: (settings: WidgetSettings[]) => void;
  onWidgetToggle: (widgetId: string) => void;
  onWidgetSettings?: (widgetId: string) => void;
  isLoading?: boolean;
  error?: string | null;
}

export const WidgetGrid: React.FC<WidgetGridProps> = ({
  widgets,
  settings,
  onSettingsChange,
  onWidgetToggle,
  onWidgetSettings,
  isLoading,
  error,
}) => {
  // Sort widgets by order from settings
  const sortedWidgets = React.useMemo(() => {
    return widgets
      .map((widget) => {
        const setting = settings.find((s) => s.widgetId === widget.id);
        return { widget, setting: setting || { widgetId: widget.id, enabled: true, order: 999 } };
      })
      .sort((a, b) => a.setting.order - b.setting.order);
  }, [widgets, settings]);

  // Only show enabled widgets
  const enabledWidgets = sortedWidgets.filter(({ setting }) => setting.enabled);

  if (enabledWidgets.length === 0) {
    return (
      <div className='text-center py-12'>
        <p className='text-gray-500 text-lg'>No widgets enabled</p>
        <p className='text-gray-400 text-sm mt-2'>Click the settings icon to enable widgets</p>
      </div>
    );
  }

  return (
    <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 auto-rows-min'>
      {enabledWidgets.map(({ widget, setting }) => {
        const WidgetComponent = widget.component;

        return (
          <WidgetContainer
            key={widget.id}
            widgetId={widget.id}
            title={widget.name}
            icon={<widget.icon size={20} />}
            size={widget.size}
            enabled={setting.enabled}
            onToggle={() => onWidgetToggle(widget.id)}
            onSettings={onWidgetSettings ? () => onWidgetSettings(widget.id) : undefined}
            isLoading={isLoading}
            error={error}
          >
            <WidgetComponent
              widgetId={widget.id}
              settings={setting.customSettings}
              isLoading={isLoading}
              error={error}
            />
          </WidgetContainer>
        );
      })}
    </div>
  );
};
