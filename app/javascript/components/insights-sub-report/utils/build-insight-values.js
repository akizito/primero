import { fromJS } from "immutable";
import first from "lodash/first";
import sortBy from "lodash/sortBy";

import { YEAR } from "../../insights/constants";

import getGroupComparator from "./get-group-comparator";
import yearComparator from "./year-comparator";
import getDataGroups from "./get-data-groups";
import sortByAgeRange from "./sort-rows-by-age-range";

const buildRows = ({ tuples, rows, columnIndex, columnsNumber }) => {
  tuples.forEach(tuple => {
    const [lookupValue, value] = tuple;

    const existing = rows.find(elem => first(elem) === lookupValue);

    if (existing) {
      existing[columnIndex] = value;
    } else {
      rows.push(
        [lookupValue]
          .concat(new Array(columnsNumber).fill(0, 0, columnsNumber))
          .fill(value, columnIndex, columnIndex + 1)
      );
    }
  });
};

const buildGroupedRows = ({ getLookupValue, data, key, groupedBy }) => {
  const groups = getDataGroups(data, groupedBy);

  const groupedData = data.groupBy(value => value.get("group_id").toString());

  if (groupedBy === YEAR) {
    return groups
      .sort(yearComparator)
      .reduce((acc, year, index) => {
        const tuples = groupedData
          .get(year, fromJS([]))
          .flatMap(value => value.get("data").map(dataElem => [getLookupValue(key, dataElem), dataElem.get("total")]))
          .toArray();

        buildRows({ tuples, rows: acc, columnsNumber: groups.length, columnIndex: index + 1 });

        return acc;
      }, [])
      .map(value => ({ colspan: 0, row: value }));
  }

  const groupComparator = getGroupComparator(groupedBy);

  const columnsNumber = data.size;

  return Object.keys(groups)
    .sort(yearComparator)
    .reduce((acc1, year, yearIndex) => {
      // index + 1 because the first value is the title of the row
      const columnInitialIndex = yearIndex + 1;

      groups[year].sort(groupComparator).forEach((group, index) => {
        const tuples = groupedData
          .get(`${year}-${group}`, fromJS([]))
          .flatMap(value => value.get("data").map(dataElem => [getLookupValue(key, dataElem), dataElem.get("total")]))
          .toArray();

        buildRows({ tuples, rows: acc1, columnIndex: columnInitialIndex + index, columnsNumber });
      });

      return acc1;
    }, [])
    .map(value => ({ colspan: 0, row: value }));
};

const buildSingleRows = ({ data, getLookupValue, key }) =>
  data
    .map(value => {
      const lookupValue = getLookupValue(key, value);

      return { colspan: 0, row: [lookupValue, value.get("total")] };
    })
    .toArray();

export default ({ getLookupValue, data, key, isGrouped, groupedBy, ageRanges }) => {
  if (data === 0) return [];

  const rows =
    isGrouped && groupedBy
      ? buildGroupedRows({ data, key, getLookupValue, groupedBy, ageRanges })
      : buildSingleRows({ data, getLookupValue, key });

  return key !== "age" ? sortBy(rows, row => first(row.row)) : sortByAgeRange(rows, ageRanges);
};
