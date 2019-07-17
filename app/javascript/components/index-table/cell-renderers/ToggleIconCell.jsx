import React from "react";
import PropTypes from "prop-types";
import { IconButton } from "@material-ui/core";
import { Photo, Flag } from "@material-ui/icons";

const ToggleIconCell = ({ value, icon }) =>
  value ? (
    <IconButton color="primary">
      {
        {
          photo: <Photo />,
          flag: <Flag />
        }[icon]
      }
    </IconButton>
  ) : null;

ToggleIconCell.propTypes = {
  value: PropTypes.oneOfType([PropTypes.bool, PropTypes.array]),
  icon: PropTypes.oneOf(["photo", "flag"])
};

export default ToggleIconCell;
