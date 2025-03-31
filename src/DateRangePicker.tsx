import * as React from 'react';
import dayjs, { Dayjs } from 'dayjs';
import isBetweenPlugin from 'dayjs/plugin/isBetween';
import { styled } from '@mui/material/styles';
import { PickersDay, PickersDayProps } from '@mui/x-date-pickers/PickersDay';
import { DatePicker } from '@mui/x-date-pickers';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import ClearIcon from '@mui/icons-material/Clear';
import InputAdornment from '@mui/material/InputAdornment';

dayjs.extend(isBetweenPlugin);

interface CustomPickerDayProps extends PickersDayProps<Dayjs> {
  dayIsBetween: boolean;
  isFirstDay: boolean;
  isLastDay: boolean;
}

const CustomPickersDay = styled(PickersDay, {
  shouldForwardProp: (prop) =>
    prop !== 'dayIsBetween' && prop !== 'isFirstDay' && prop !== 'isLastDay',
})<CustomPickerDayProps>(({ theme, dayIsBetween, isFirstDay, isLastDay }) => ({
  borderRadius: '50%',
  '&:hover': {
    color: theme.palette.common.white,
    backgroundColor: theme.palette.primary.dark,
  },
  ...(dayIsBetween && {
    '&:focus': {
      color: theme.palette.common.white,
      backgroundColor: theme.palette.primary.dark,
    },
  }),
  ...((isFirstDay || isLastDay) && {
    color: theme.palette.common.white,
    backgroundColor: theme.palette.primary.main,
  }),
})) as React.ComponentType<CustomPickerDayProps>;

function Day(
  props: PickersDayProps<Dayjs> & {
    startDay?: Dayjs | null;
    endDay?: Dayjs | null;
  }
) {
  const { day, startDay, endDay, ...other } = props;

  if (!startDay && !endDay) {
    return <PickersDay day={day} {...other} />;
  }

  const start = startDay || endDay;
  const end = endDay || startDay;

  const dayIsBetween = day.isBetween(start, end, null, '[]');
  const isFirstDay = day.isSame(start, 'day');
  const isSunday = day.day() === 0;
  const isSaturday = day.day() === 6;
  const isLastDay = day.isSame(end, 'day');

  return (
    <div
      style={{
        ...(dayIsBetween && {
          backgroundColor: '#eee',
        }),
        ...((isFirstDay || isSunday) && {
          borderTopLeftRadius: '50%',
          borderBottomLeftRadius: '50%',
        }),
        ...((isLastDay || isSaturday) && {
          borderTopRightRadius: '50%',
          borderBottomRightRadius: '50%',
        }),
      }}
    >
      <CustomPickersDay
        {...other}
        day={day}
        sx={dayIsBetween ? { px: 2.5, mx: 0 } : {}}
        dayIsBetween={dayIsBetween}
        isFirstDay={isFirstDay}
        isLastDay={isLastDay}
      />
    </div>
  );
}

// Properly type the CustomTextField props
interface CustomTextFieldProps {
  error?: string;
  startDay?: Dayjs | null;
  endDay?: Dayjs | null;
  onClearHandler?: () => void;
  InputProps?: any;
  [key: string]: any; // for other props
}

function CustomTextField(props: CustomTextFieldProps) {
  const { error, startDay, endDay, onClearHandler, InputProps = {}, ...rest } = props;
  const hasDateSelected = !!(startDay || endDay);

  // Handle the clear button click
  const handleClearClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (typeof onClearHandler === 'function') {
      onClearHandler();
    }
    
    // Prevent the DatePicker from opening
    const inputElement = (event.currentTarget as HTMLElement).closest('.MuiFormControl-root')?.querySelector('input');
    if (inputElement) {
      setTimeout(() => {
        (inputElement as HTMLElement).blur();
      }, 0);
    }
  };

  // Combine the default InputProps with our clear button
  const combinedInputProps = {
    ...InputProps,
    endAdornment: (
      <React.Fragment>
        {hasDateSelected && (
          <InputAdornment position="end">
            <IconButton
              aria-label="clear date range"
              onClick={handleClearClick}
              onMouseDown={(e) => e.preventDefault()}
              edge="end"
              size="small"
            >
              <ClearIcon fontSize="small" />
            </IconButton>
          </InputAdornment>
        )}
        {InputProps.endAdornment}
      </React.Fragment>
    ),
  };

  return (
    <TextField
      {...rest}
      size="small"
      error={!!error}
      helperText={error && `* ${error}`}
      sx={{ minWidth: '280px' }}
      placeholder={'Start - End'}
      value={`${startDay ? startDay.format('D MMM YYYY') : 'Start'} - ${
        endDay ? endDay.format('D MMM YYYY') : 'End'
      }`}
      InputProps={combinedInputProps}
    />
  );
}

interface DateRangePickerProps {
  value: (Dayjs | null)[];
  onChange: (value: (Dayjs | null)[]) => void;
  error?: string;
}

export default function DateRangePicker({
  value,
  onChange,
  error,
}: DateRangePickerProps) {
  const [startTurn, setStartTurn] = React.useState(true);
  // Ensure values are never undefined to keep component controlled
  const startDay = value[0] || null;
  const endDay = value[1] || null;
  
  // This keeps track of which date the picker is currently focused on
  const [pickerValue, setPickerValue] = React.useState<Dayjs | null>(startDay || null);

  const updateValue = (newVal: (Dayjs | null)[]) => {
    onChange(newVal);
  };

  // Update picker value when external value changes
  React.useEffect(() => {
    setPickerValue(startTurn ? startDay : endDay);
  }, [startDay, endDay, startTurn]);

  const handleChange = (newValue: Dayjs | null) => {
    if (!newValue) {
      return;
    }
    
    setPickerValue(newValue);
    
    if (startTurn) {
      const isReverse = endDay && newValue?.isAfter(endDay);
      if (isReverse) {
        updateValue([newValue, null]);
      } else {
        updateValue([newValue, endDay]);
      }
      setStartTurn(false);
    } else {
      const isReverse = startDay && newValue?.isBefore(startDay);
      if (isReverse) {
        updateValue([newValue, startDay]);
        setStartTurn(false);
      } else {
        updateValue([startDay, newValue]);
        setStartTurn(true);
      }
    }
  };
  
  const handleClear = () => {
    // Clear the date values while maintaining controlled state
    updateValue([null, null]);
    setPickerValue(null);
    setStartTurn(true);
  };

  return (
    <DatePicker
      value={pickerValue}
      label={'Date Range'}
      onChange={handleChange}
      showDaysOutsideCurrentMonth
      disableHighlightToday
      closeOnSelect={false}
      autoFocus={false}
      slots={{ day: Day, textField: CustomTextField }}
      slotProps={{
        day: {
          startDay: startDay,
          endDay: endDay,
        } as any,
        textField: {
          error: error,
          startDay: startDay,
          endDay: endDay,
          onClearHandler: handleClear,
        } as any,
      }}
    />
  );
}