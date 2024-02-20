import React from 'react';
import classNames from 'classnames';

import ToggleButton from '@material-ui/lab/ToggleButton';
import MuiAlert from '@material-ui/lab/Alert';
import {
  Box,
  Checkbox,
  Divider,
  InputBase,
  Popper,
  Snackbar,
  Tooltip,
} from '@material-ui/core';
import Autocomplete from '@material-ui/lab/Autocomplete';
import {
  CheckBox as CheckBoxIcon,
  CheckBoxOutlineBlank,
} from '@material-ui/icons';
import { makeStyles } from '@material-ui/core/styles';

import { Badge, Button, Icon, Text } from 'components/kit';
import ErrorBoundary from 'components/ErrorBoundary/ErrorBoundary';
import AutocompleteInput from 'components/AutocompleteInput';

import { ANALYTICS_EVENT_KEYS } from 'config/analytics/analyticsKeysMap';

import paramsAppModel from 'services/models/params/paramsAppModel';
import { trackEvent } from 'services/analytics';

import { ISelectFormProps } from 'types/pages/params/components/SelectForm/SelectForm';
import { ISelectOption } from 'types/services/models/explorer/createAppModel';

import './SelectForm.scss';

const useStyles = makeStyles({
  popper: {
    width: '100% !important',
  },
});

function SelectForm({
  requestIsPending,
  isDisabled = false,
  onParamsSelectChange,
  selectedParamsData,
  onSelectRunQueryChange,
  selectFormData,
}: ISelectFormProps): React.FunctionComponentElement<React.ReactNode> {
  const [anchorEl, setAnchorEl] = React.useState<any>(null);
  const [searchValue, setSearchValue] = React.useState<string>('');
  const [isRegexSearch, setIsRegexSearch] = React.useState(false);
  const [regexError, setRegexError] = React.useState<string | null>(null);
  const searchRef = React.useRef<any>(null);
  const autocompleteRef: any = React.useRef<React.MutableRefObject<any>>(null);
  const classes = useStyles();
  React.useEffect(() => {
    return () => {
      searchRef.current?.abort();
    };
  }, []);

  function handleParamsSearch() {
    if (requestIsPending) {
      return;
    }
    const query = autocompleteRef?.current?.getValue();
    onSelectRunQueryChange(query ?? '');
    searchRef.current = paramsAppModel.getParamsData(true, true, query ?? '');
    searchRef.current.call();
    trackEvent(ANALYTICS_EVENT_KEYS.params.searchClick);
  }

  function handleRequestAbort(e: React.SyntheticEvent): void {
    e.preventDefault();
    if (!requestIsPending) {
      return;
    }
    searchRef.current?.abort();
    paramsAppModel.abortRequest();
  }

  function onSelect(
    event: React.ChangeEvent<{}>,
    value: ISelectOption[],
  ): void {
    if (event.type === 'click' || event.type === 'change') {
      const lookup = value.reduce(
        (acc: { [key: string]: number }, curr: ISelectOption) => {
          acc[curr.key] = ++acc[curr.key] || 0;
          return acc;
        },
        {},
      );
      onParamsSelectChange(
        value?.filter((option: ISelectOption) => lookup[option.key] === 0),
      );
    }
  }

  function handleDelete(field: string): void {
    let fieldData = [...(selectedParamsData?.options || [])]?.filter(
      (opt: ISelectOption) => opt.key !== field,
    );
    onParamsSelectChange(fieldData);
  }

  function handleClick(event: React.ChangeEvent<any>) {
    setAnchorEl(event.currentTarget);
  }

  function handleClose(event: any, reason: any) {
    if (reason === 'toggleInput') {
      return;
    }
    if (anchorEl) {
      anchorEl.focus();
    }
    setAnchorEl(null);
    setSearchValue('');
  }

  function handleSearchInputChange(
    e: React.ChangeEvent<HTMLInputElement>,
  ): void {
    e.preventDefault();
    e.stopPropagation();
    setSearchValue(e.target.value);
  }

  const options = React.useMemo(() => {
    if (isRegexSearch) {
      try {
        const regex = new RegExp(searchValue, 'i');
        setRegexError(null);
        return (
          selectFormData?.options?.filter((option) =>
            regex.test(option.label),
          ) ?? []
        );
      } catch (error) {
        setRegexError('Invalid Regual Expression');
        return [];
      }
    } else {
      return (
        selectFormData?.options?.filter(
          (option) => option.label.indexOf(searchValue) !== -1,
        ) ?? []
      );
    }
  }, [searchValue, selectFormData?.options]);

  const open: boolean = !!anchorEl;
  const id = open ? 'select-metric' : undefined;
  return (
    <ErrorBoundary>
      <div className='SelectForm__container'>
        <div className='SelectForm__params__container'>
          <Box display='flex'>
            <Box
              width='100%'
              display='flex'
              justifyContent='space-between'
              alignItems='center'
            >
              <ErrorBoundary>
                <Box display='flex' alignItems='center'>
                  <Button
                    variant='contained'
                    color='primary'
                    onClick={handleClick}
                    aria-describedby={id}
                    disabled={isDisabled}
                  >
                    <Icon name='plus' style={{ marginRight: '0.5rem' }} /> Run
                    Params
                  </Button>
                  <Popper
                    id={id}
                    open={open}
                    anchorEl={anchorEl}
                    placement='bottom-start'
                    className='SelectForm__Popper'
                  >
                    <Autocomplete
                      open
                      onClose={handleClose}
                      multiple
                      size='small'
                      disablePortal
                      disableCloseOnSelect
                      options={options}
                      value={selectedParamsData?.options}
                      onChange={onSelect}
                      classes={{
                        popper: classes.popper,
                      }}
                      groupBy={(option) => option.group}
                      getOptionLabel={(option) => option.label}
                      renderTags={() => null}
                      disableClearable={true}
                      ListboxProps={{
                        style: {
                          height: 400,
                        },
                      }}
                      renderInput={(params) => (
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <Checkbox
                            color='primary'
                            icon={<CheckBoxOutlineBlank />}
                            checkedIcon={<CheckBoxIcon />}
                            checked={
                              selectedParamsData?.options.length ===
                              options.length
                            }
                            onChange={(event) => {
                              if (event.target.checked) {
                                onSelect(event, options);
                              } else {
                                onSelect(event, []);
                              }
                            }}
                            size='small'
                          />
                          <InputBase
                            ref={params.InputProps.ref}
                            inputProps={{
                              ...params.inputProps,
                              value: searchValue,
                              onChange: handleSearchInputChange,
                            }}
                            autoFocus={true}
                            style={{ flex: 1 }}
                            spellCheck={false}
                            className='SelectForm__param__select'
                          />
                          <Snackbar
                            open={!!regexError}
                            autoHideDuration={6000}
                            onClose={() => setRegexError(null)}
                          >
                            <MuiAlert
                              elevation={6}
                              variant='filled'
                              severity='error'
                              onClose={() => setRegexError(null)}
                            >
                              {regexError}
                            </MuiAlert>
                          </Snackbar>
                          <Tooltip title='Use Regular Expression'>
                            <ToggleButton
                              value='check'
                              selected={isRegexSearch}
                              onChange={() => {
                                setIsRegexSearch(!isRegexSearch);
                              }}
                              style={{
                                border: 'none',
                                height: 35,
                                margin: 10,
                              }}
                            >
                              .*
                            </ToggleButton>
                          </Tooltip>
                        </div>
                      )}
                      renderOption={(option) => {
                        let selected: boolean =
                          !!selectedParamsData?.options.find(
                            (item: ISelectOption) => item.key === option.key,
                          )?.key;
                        return (
                          <div className='SelectForm__option'>
                            <Checkbox
                              color='primary'
                              icon={<CheckBoxOutlineBlank />}
                              checkedIcon={<CheckBoxIcon />}
                              checked={selected}
                            />
                            <Text
                              className='SelectForm__option__label'
                              size={14}
                            >
                              {option.label}
                            </Text>
                          </div>
                        );
                      }}
                    />
                  </Popper>
                  <Divider
                    style={{ margin: '0 1em' }}
                    orientation='vertical'
                    flexItem
                  />
                  {selectedParamsData?.options.length === 0 && (
                    <Text tint={50} size={14} weight={400}>
                      No params are selected
                    </Text>
                  )}
                  {selectedParamsData?.options &&
                    selectedParamsData.options.length > 0 && (
                      <ErrorBoundary>
                        <Box
                          className='SelectForm__tags ScrollBar__hidden'
                          flex={1}
                        >
                          {selectedParamsData?.options?.map(
                            (tag: ISelectOption) => {
                              return (
                                <Badge
                                  size='large'
                                  key={tag.label}
                                  label={tag.label}
                                  value={tag.key}
                                  onDelete={handleDelete}
                                  disabled={isDisabled}
                                />
                              );
                            },
                          )}
                        </Box>
                      </ErrorBoundary>
                    )}
                </Box>
                {selectedParamsData?.options &&
                  selectedParamsData.options.length > 1 && (
                    <ErrorBoundary>
                      <Button
                        onClick={() => onParamsSelectChange([])}
                        withOnlyIcon
                        className={classNames('SelectForm__clearAll', {
                          disabled: isDisabled,
                        })}
                        size='xSmall'
                        disabled={isDisabled}
                      >
                        <Icon name='close' />
                      </Button>
                    </ErrorBoundary>
                  )}
              </ErrorBoundary>
            </Box>
            <Button
              color='primary'
              key={`${requestIsPending}`}
              variant={requestIsPending ? 'outlined' : 'contained'}
              startIcon={
                <Icon
                  name={requestIsPending ? 'close' : 'search'}
                  fontSize={requestIsPending ? 12 : 14}
                />
              }
              className='Params__SelectForm__search__button'
              onClick={
                requestIsPending ? handleRequestAbort : handleParamsSearch
              }
            >
              {requestIsPending ? 'Cancel' : 'Search'}
            </Button>
          </Box>
          <div className='SelectForm__TextField'>
            <AutocompleteInput
              refObject={autocompleteRef}
              context={selectFormData?.suggestions}
              error={selectFormData?.error}
              onEnter={handleParamsSearch}
              value={selectedParamsData?.query}
              disabled={isDisabled}
            />
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default React.memo(SelectForm);
