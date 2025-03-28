import React from 'react';
import PropTypes from 'prop-types';
import { NavLink, useLocation } from 'react-router-dom';
// mui imports
import {
  ListItemIcon,
  ListItem,
  List,
  styled,
  ListItemText,
  useTheme
} from '@mui/material';

const NavItem = ({ item, level, onClick }) => {
  const Icon = item.icon;
  const theme = useTheme();
  const location = useLocation();
  const itemIcon = <Icon stroke={1.5} size="1.3rem" />;

  const ListItemStyled = styled(ListItem)(() => ({
    whiteSpace: 'nowrap',
    marginBottom: '2px',
    padding: '8px 10px',
    borderRadius: '8px',
    backgroundColor: level > 1 ? 'transparent !important' : 'inherit',
    color: '#2B3674', // Default text color
    paddingLeft: '10px',
    position: 'relative',
    transition: 'all 0.2s ease-in-out',
    '&:hover': {
      backgroundColor: '#F6F8FF', // Light hover background
      color: '#5D87FF', // Primary color on hover
      '.MuiListItemIcon-root': {
        color: '#5D87FF', // Icon color on hover
      }
    },
    '&.active': {
      backgroundColor: '#ECF2FF', // Light primary color background
      color: '#5D87FF', // Primary color text
      fontWeight: '600',
      '.MuiListItemIcon-root': {
        color: '#5D87FF', // Icon color when active
      },
      '&::before': {
        content: '""',
        position: 'absolute',
        left: '0',
        top: '50%',
        transform: 'translateY(-50%)',
        height: '60%',
        width: '4px',
        backgroundColor: '#5D87FF', // Primary color indicator
        borderRadius: '0 4px 4px 0',
      },
      '&:hover': {
        backgroundColor: '#ECF2FF', // Maintain same background on hover when active
        color: '#5D87FF', // Maintain same text color on hover when active
      },
    },
  }));

  return (
    <List component="li" disablePadding key={item.id}>
      <ListItemStyled
        button
        component={NavLink}
        to={item.href}
        className={({ isActive }) => (isActive ? 'active' : '')}
        end
        onClick={onClick}
      >
        <ListItemIcon
          sx={{
            minWidth: '36px',
            p: '3px 0',
            color: '#2B3674', // Default icon color
            transition: 'color 0.2s ease-in-out',
          }}
        >
          {itemIcon}
        </ListItemIcon>
        <ListItemText
          primary={item.title}
          sx={{
            '& .MuiTypography-root': {
              fontSize: '14px',
            },
          }}
        />
      </ListItemStyled>
    </List>
  );
};

NavItem.propTypes = {
  item: PropTypes.object,
  level: PropTypes.number,
  onClick: PropTypes.func,
};

export default NavItem;
