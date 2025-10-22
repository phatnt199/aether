import React from 'react';

export const useSizer = (props: {
  containerId: string;
}): { width: number; height: number } => {
  const [width, setWidth] = React.useState<number>(0);
  const [height, setHeight] = React.useState<number>(0);

  const cached = React.useRef<{ width: number; height: number }>({ width, height });

  React.useEffect(() => {
    const { containerId } = props;
    const container = document.getElementById(containerId);
    if (!container) {
      return;
    }

    const sizeObserver = new ResizeObserver(() => {
      if (container.offsetWidth !== cached.current.width) {
        setWidth(container.clientWidth + 1);
      }

      if (container.offsetHeight !== cached.current.height) {
        setHeight(container.offsetHeight + 1);
      }
    });
    sizeObserver.observe(container);

    return () => {
      sizeObserver.disconnect();
    };
  }, [props]);

  React.useEffect(() => {
    cached.current.width = width;
  }, [width]);

  React.useEffect(() => {
    cached.current.height = height;
  }, [height]);

  return { width, height };
};
