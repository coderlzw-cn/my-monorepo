"use client";

import { RiAddLine, RiSubtractLine } from "@remixicon/react";
import * as React from "react";

import { Input } from "@workspace/ui/components/shadcn/input";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput, InputGroupText } from "@workspace/ui/components/shadcn/input-group";

/** 数字输入校验配置。 */
export interface NumberInputValidationOptions {
  min?: number;
  max?: number;
  integer?: boolean;
  allowNegative?: boolean;
  allowEmpty?: boolean;
}

/** 数字输入格式配置。 */
export interface NumberInputFormatOptions {
  allowNegative?: boolean;
  allowDecimal?: boolean;
  allowScientific?: boolean;
}

export interface NumberInputProps extends Omit<React.ComponentProps<"input">, "value" | "defaultValue" | "onChange" | "type" | "inputMode" | "min" | "max" | "step" | "prefix"> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  onNumberChange?: (value: number | undefined) => void;
  min?: number;
  max?: number;
  step?: number;
  /** 仅允许整数输入，默认 `false`。 */
  integer?: boolean;
  /** 是否允许负数，默认 `true`。 */
  allowNegative?: boolean;
  /** 是否允许小数，默认 `true`；`integer` 为 `true` 时无效。 */
  allowDecimal?: boolean;
  /** 是否允许科学计数法，默认 `false`。 */
  allowScientific?: boolean;
  /** 失焦时是否将数值钳制到 min/max，默认 `false`。 */
  clampOnBlur?: boolean;
  /** 前缀文本，例如货币符号。 */
  prefix?: React.ReactNode;
  /** 后缀文本，例如单位。 */
  suffix?: React.ReactNode;
  /** 是否显示增减按钮，默认 `true`。 */
  showStepButtons?: boolean;
  /** 显式覆盖无效态；未提供时根据 min/max/integer 自动判断。 */
  invalid?: boolean;
}

const INTEGER_PARTIAL_PATTERN = /^-?\d*$/u;
const DECIMAL_PARTIAL_PATTERN = /^-?\d*\.?\d*$/u;
const SCIENTIFIC_PARTIAL_PATTERN = /^-?\d*\.?\d*(?:[eE][+-]?\d*)?$/u;

function resolveFormatOptions(options: NumberInputFormatOptions & { integer?: boolean }) {
  const integer = options.integer ?? false;
  return {
    allowNegative: options.allowNegative ?? true,
    allowDecimal: integer ? false : (options.allowDecimal ?? true),
    allowScientific: integer ? false : (options.allowScientific ?? false),
  };
}

/** 判断当前输入内容是否处于可继续编辑的中间态。 */
export function isPartialNumberInput(value: string, options: NumberInputFormatOptions & { integer?: boolean } = {}): boolean {
  if (value.length === 0) return true;

  const format = resolveFormatOptions(options);
  if (!format.allowNegative && value.startsWith("-")) return false;
  if (!format.allowDecimal && value.includes(".")) return false;
  if (!format.allowScientific && /[eE]/u.test(value)) return false;

  const pattern = format.allowScientific ? SCIENTIFIC_PARTIAL_PATTERN : format.allowDecimal ? DECIMAL_PARTIAL_PATTERN : INTEGER_PARTIAL_PATTERN;
  return pattern.test(value);
}

/** 将输入字符串解析为有限数字；不完整或非法输入返回 `undefined`。 */
export function parseNumberInputValue(value: string): number | undefined {
  const normalized = value.trim();
  if (normalized.length === 0 || normalized === "-" || normalized === "." || normalized === "-." || /[eE][+-]?$/u.test(normalized)) return undefined;

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

/** 判断输入是否为完整合法数字。 */
export function isNumberInputValid(value: string, options: NumberInputValidationOptions = {}): boolean {
  const { min, max, integer = false, allowNegative = true, allowEmpty = false } = options;
  if (value.trim().length === 0) return allowEmpty;

  const parsed = parseNumberInputValue(value);
  if (parsed === undefined) return false;
  if (!allowNegative && parsed < 0) return false;
  if (integer && !Number.isInteger(parsed)) return false;
  if (min !== undefined && parsed < min) return false;
  if (max !== undefined && parsed > max) return false;
  return true;
}

function normalizeNumberInputValue(value: string, integer: boolean): string {
  const parsed = parseNumberInputValue(value);
  if (parsed === undefined) return value.trim().length === 0 ? "" : value;
  return String(integer ? Math.trunc(parsed) : parsed);
}

function clampNumber(value: number, min?: number, max?: number): number {
  return Math.min(max ?? Number.POSITIVE_INFINITY, Math.max(min ?? Number.NEGATIVE_INFINITY, value));
}

function NumberInput({
  value,
  defaultValue = "",
  onValueChange,
  onNumberChange,
  min,
  max,
  step = 1,
  integer = false,
  allowNegative = true,
  allowDecimal = true,
  allowScientific = false,
  clampOnBlur = false,
  prefix,
  suffix,
  showStepButtons = true,
  invalid,
  disabled,
  readOnly,
  className,
  onBlur,
  ref,
  ...props
}: NumberInputProps) {
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  const currentValue = value ?? internalValue;
  const isControlled = value !== undefined;
  const formatOptions = { allowDecimal, allowNegative, allowScientific, integer };

  const publishValue = (nextValue: string) => {
    if (!isControlled) setInternalValue(nextValue);
    onValueChange?.(nextValue);
    onNumberChange?.(parseNumberInputValue(nextValue));
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (isPartialNumberInput(event.target.value, formatOptions)) publishValue(event.target.value);
  };

  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    let nextValue = normalizeNumberInputValue(currentValue, integer);
    const parsed = parseNumberInputValue(nextValue);
    if (clampOnBlur && parsed !== undefined) nextValue = String(clampNumber(parsed, min, max));
    if (nextValue !== currentValue) publishValue(nextValue);
    onBlur?.(event);
  };

  const changeByStep = (direction: -1 | 1) => {
    const parsed = parseNumberInputValue(currentValue);
    const fallback = direction > 0 ? (min ?? 0) : (max ?? 0);
    const nextValue = parsed === undefined ? fallback : parsed + direction * step;
    publishValue(String(clampNumber(integer ? Math.trunc(nextValue) : nextValue, min, max)));
  };

  const ariaInvalid =
    invalid ??
    (currentValue.trim().length > 0 &&
      !isNumberInputValid(currentValue, {
        min,
        max,
        integer,
        allowNegative,
      }));
  const input = (
    <InputGroupInput
      {...props}
      ref={ref}
      aria-invalid={ariaInvalid}
      className={className}
      disabled={disabled}
      inputMode={integer || !allowDecimal ? "numeric" : "decimal"}
      readOnly={readOnly}
      type="text"
      value={currentValue}
      onBlur={handleBlur}
      onChange={handleChange}
    />
  );

  if (prefix === undefined && suffix === undefined && !showStepButtons) {
    return (
      <Input
        {...props}
        ref={ref}
        aria-invalid={ariaInvalid}
        className={className}
        data-slot="number-input"
        disabled={disabled}
        inputMode={integer || !allowDecimal ? "numeric" : "decimal"}
        readOnly={readOnly}
        type="text"
        value={currentValue}
        onBlur={handleBlur}
        onChange={handleChange}
      />
    );
  }

  return (
    <InputGroup data-disabled={disabled || undefined} data-slot="number-input">
      {prefix !== undefined ? (
        <InputGroupAddon align="inline-start">
          <InputGroupText>{prefix}</InputGroupText>
        </InputGroupAddon>
      ) : null}
      {input}
      <InputGroupAddon align="inline-end">
        {suffix !== undefined ? <InputGroupText>{suffix}</InputGroupText> : null}
        {showStepButtons ? (
          <>
            <InputGroupButton aria-label="减小数值" disabled={disabled || readOnly} size="icon-xs" onClick={() => changeByStep(-1)}>
              <RiSubtractLine aria-hidden="true" />
            </InputGroupButton>
            <InputGroupButton aria-label="增大数值" disabled={disabled || readOnly} size="icon-xs" onClick={() => changeByStep(1)}>
              <RiAddLine aria-hidden="true" />
            </InputGroupButton>
          </>
        ) : null}
      </InputGroupAddon>
    </InputGroup>
  );
}

export { NumberInput };
