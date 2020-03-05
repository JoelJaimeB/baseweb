/*
Copyright (c) 2018-2020 Uber Technologies, Inc.

This source code is licensed under the MIT license found in the
LICENSE file in the root directory of this source tree.
*/
// @flow

import * as React from 'react';

export function useCellNavigation() {
  const cells = React.useRef([]);
  const [columnIndex, setColumnIndex] = React.useState(0);
  const [rowIndex, setRowIndex] = React.useState(0);
  const [focusCoords, setFocusCoords] = React.useState([-1, -1]);

  const initialAddressableCoordinates = [0, 0];
  const [addressableCoordinates, setAddressableCoodinates] = React.useState(
    initialAddressableCoordinates,
  );

  function cellAtCoordinates(column, row) {
    const candidateRow = cells.current[row];
    if (candidateRow) {
      return candidateRow[column];
    }
  }

  function register(ref, column, row) {
    if (!cells.current[row]) {
      cells.current[row] = [];
    }
    cells.current[row][column] = ref;
  }

  const addressableCell = React.useMemo(() => {
    return cellAtCoordinates(columnIndex, rowIndex);
  }, [columnIndex, rowIndex]);

  const mounted = React.useRef(false);
  React.useEffect(() => {
    if (mounted.current) {
      if (addressableCell && addressableCell.focus) {
        addressableCell.focus();
      }
    }
    mounted.current = true;
  }, [addressableCell, mounted.current]);

  function isInBounds(column, row) {
    return (
      row >= 0 &&
      row < cells.current.length &&
      column >= 0 &&
      column < cells.current[0].length
    );
  }

  type Point = [number, number];

  const UP = [0, -1];
  const RIGHT = [1, 0];
  const DOWN = [0, 1];
  const LEFT = [-1, 0];

  function nextInDirection(origin, direction: Point): ?Point {
    function vAdd(a: Point, b: Point) {
      return [a[0] + b[0], a[1] + b[1]];
    }
    let next = vAdd(origin, direction);
    while (isInBounds(...next)) {
      const exists = cellAtCoordinates(...next);
      if (exists) {
        return next;
      } else {
        next = vAdd(next, direction);
      }
    }

    const priorityUp = vAdd(vAdd(origin, direction), UP);
    if (isInBounds(...priorityUp)) {
      return nextInDirection(vAdd(origin, direction), UP);
    }

    const priorityLeft = vAdd(vAdd(origin, direction), LEFT);
    if (isInBounds(...priorityLeft)) {
      return nextInDirection(vAdd(origin, direction), LEFT);
    }

    return null;
  }

  function handleKeyDown(event: SyntheticKeyboardEvent<HTMLElement>) {
    let direction = [0, 0];
    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault();
        direction = UP;
        break;
      case 'ArrowRight':
        event.preventDefault();
        direction = RIGHT;
        break;
      case 'ArrowDown':
        event.preventDefault();
        direction = DOWN;
        break;
      case 'ArrowLeft':
        event.preventDefault();
        direction = LEFT;
        break;
      default:
        break;
    }

    const next = nextInDirection([columnIndex, rowIndex], direction);
    if (next) {
      setColumnIndex(next[0]);
      setRowIndex(next[1]);
    }
  }

  const getCellProps = React.useMemo(() => {
    return function(column: number, row: number) {
      const isAddressable = column === columnIndex && row === rowIndex;
      const isFocused = focusCoords[0] === column && focusCoords[1] === row;
      return {
        ref: (r: ?HTMLElement) => register(r, column, row),
        tabIndex: isAddressable ? 0 : undefined,
        onBlur: () => setFocusCoords([-1, -1]),
        onFocus: () => setFocusCoords([column, row]),
        onKeyDown: isAddressable ? handleKeyDown : undefined,
        $isFocusVisible: isFocused,
      };
    };
  }, [columnIndex, rowIndex, focusCoords]);

  return {getCellProps};
}
