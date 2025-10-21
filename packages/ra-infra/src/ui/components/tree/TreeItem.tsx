import {
  Collapse,
  Icon,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import React from 'react';
import { ITreeData } from './Tree';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

export interface ITreeItemProps {
  height?: number;
  enableActivated?: (opts: { id: ITreeData['id'] }) => boolean;
  onClick?: (opts: {
    event: React.MouseEvent<HTMLDivElement, MouseEvent>;
    id: ITreeData['id'];
  }) => void;
}

interface IProps extends ITreeItemProps {
  data: ITreeData;
  level: number;
}

export const TreeItem = (props: IProps) => {
  const { data, level, ...restProps } = props;
  const { height = 24, enableActivated, onClick } = restProps;

  //--------------------------------------------------
  const [isOpen, setIsOpen] = React.useState(false);

  //--------------------------------------------------
  const hasChild = React.useMemo(() => {
    return (data?.children && data.children.length > 0) ?? false;
  }, [data.children]);

  //--------------------------------------------------
  const isActivated = React.useMemo(() => {
    return enableActivated?.({ id: data.id });
  }, [data.id, enableActivated]);

  //--------------------------------------------------
  const handleClick = React.useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  //--------------------------------------------------
  const renderIcon = React.useCallback(
    (opts: { isOpen: boolean; hasChild: boolean; icon?: ITreeData['icon'] }) => {
      if (!opts.hasChild) {
        return <Icon>opts?.icon?.default</Icon>;
      }

      const ExpandedIcon = opts.icon?.expanded || KeyboardArrowDownIcon;
      const CollapsedIcon = opts.icon?.collapsed || KeyboardArrowRightIcon;

      if (opts.isOpen) {
        return <ExpandedIcon />;
      }

      return <CollapsedIcon />;
    },
    [],
  );

  //--------------------------------------------------
  return (
    <List disablePadding dense sx={{ overflowX: 'hidden', width: 1 }}>
      <ListItem
        dense
        disableGutters
        disablePadding
        sx={{ height, pl: level > 1 ? (level - 1) * 3 + 3 : 1 }}
      >
        <ListItemButton
          dense
          disableGutters
          color="primary"
          sx={{
            height: 1,
            cursor: 'pointer',
            bgcolor: isActivated ? 'primary.light' : 'transparent',
          }}
          alignItems="center"
          onClick={event => {
            onClick?.({ event, id: data.id });
            handleClick();
          }}
        >
          <ListItemIcon sx={{ minWidth: 'unset' }}>
            {renderIcon({ isOpen, hasChild, icon: data.icon })}
          </ListItemIcon>

          <ListItemText disableTypography sx={{ m: 0, fontSize: 12 }}>
            {data.label}
          </ListItemText>
        </ListItemButton>
      </ListItem>

      {hasChild && (
        <Collapse in={isOpen} unmountOnExit>
          {data.children?.map(item => {
            return (
              <TreeItem key={item.id} data={item} level={level + 1} {...restProps} />
            );
          })}
        </Collapse>
      )}
    </List>
  );
};
