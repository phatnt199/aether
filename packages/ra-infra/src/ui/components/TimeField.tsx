import React from 'react';

import { TextField, TextFieldProps } from '@mui/material';
import { NumericFormatProps, PatternFormat } from 'react-number-format';

interface ICustomProps extends NumericFormatProps {
  onChange: (event: { target: { name: string; value: string } }) => void;
  name: string;
}

const Ref = (props: ICustomProps, ref: React.Ref<any>) => {
  const { onChange, ...other } = props;

  return (
    <PatternFormat
      {...other}
      getInputRef={ref}
      onKeyUp={(e: any) => {
        onChange?.({
          target: {
            name: props.name,
            value: e.target.value?.replace(/,/g, ''),
          },
        });
      }}
      format="##:##:##"
    />
  );
};

const TimeCustomFormat = React.forwardRef(Ref);

export const TimeField: React.FC<TextFieldProps> = props => {
  return (
    <TextField
      {...props}
      InputProps={{
        ...(props?.InputProps ?? {}),
        inputComponent: TimeCustomFormat as any,
      }}
    />
  );
};
