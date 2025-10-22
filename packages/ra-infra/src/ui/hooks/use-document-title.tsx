import React from 'react';

export interface IUseDocumentTitleParams {
  value?: string;
  defaultValue?: string;
}

export const useDocumentTitle = (params: IUseDocumentTitleParams) => {
  const { value = '', defaultValue = '' } = params;

  //---------------------------------------------------------------------------
  React.useEffect(() => {
    document.title = value;

    return () => {
      document.title = defaultValue;
    };
  }, [value, defaultValue]);
};
