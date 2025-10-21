import React from 'react';

import { TextField, TextFieldProps } from '@mui/material';
import { NumericFormat, NumericFormatProps } from 'react-number-format';

interface ICustomProps extends NumericFormatProps {
  onChange: (event: { target: { name: string; value: string } }) => void;
  name: string;
}

const Ref = (props: ICustomProps, ref: React.Ref<any>) => {
  const { onChange, ...other } = props;

  return (
    <NumericFormat
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
      thousandSeparator
      valueIsNumericString
    />
  );
};

const NumericFormatCustom = React.forwardRef(Ref);

export const NumberField: React.FC<TextFieldProps> = props => {
  return (
    <TextField
      {...props}
      InputProps={{
        ...(props?.InputProps ?? {}),
        inputComponent: NumericFormatCustom as any,
      }}
    />
  );
};
