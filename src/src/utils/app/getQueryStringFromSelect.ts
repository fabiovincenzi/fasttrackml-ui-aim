import { ISyntaxErrorDetails } from 'types/components/NotificationContainer/NotificationContainer';
import { ISelectConfig } from 'types/services/models/explorer/createAppModel';

import { jsValidVariableRegex } from 'utils/getObjectPaths';

import { formatValue } from '../formatValue';

import { getSelectedExperimentNames } from './getSelectedExperimentNames';

export default function getQueryStringFromSelect(
  selectData: ISelectConfig,
  excludeMetrics?: boolean,
  error?: ISyntaxErrorDetails,
) {
  let query = '()';
  if (selectData === undefined) {
    return query;
  }
  if (selectData.advancedMode) {
    query = selectData.advancedQuery || '';
  } else {
    const simpleInput =
      selectData.query?.trim() && !error?.message
        ? `(${selectData.query.trim()})`
        : '';

    let selections = '';
    if (!excludeMetrics) {
      selections = selectData.options?.length
        ? `(${selectData.options
            .map((option) => {
              const metricName = option.value?.option_name.replaceAll(
                '"',
                '\\"',
              );
              return `(metric.name == "${metricName}"${
                option.value?.context === null
                  ? ''
                  : ' and ' +
                    Object.keys(option.value?.context)
                      .map((item) => {
                        const contextName = !jsValidVariableRegex.test(item)
                          ? `['${item.replaceAll('"', '\\"')}']`
                          : `.${item}`;
                        const value = (option.value?.context as any)[item];
                        return `metric.context${contextName} == ${formatValue(
                          value,
                        )}`;
                      })
                      .join(' and ')
              })`;
            })
            .join(' or ')})`
        : '';
    }

    const selectedExperiments = getSelectedExperimentNames();

    const experimentNames = `run.experiment in ["${selectedExperiments.join(
      '", "',
    )}"]`;

    if (simpleInput && selections) {
      query = `${simpleInput} and ${selections}`;
    } else {
      query = `${simpleInput}${selections}`;
    }

    query = query ? `${query} and ${experimentNames}` : experimentNames;
  }
  return excludeMetrics ? query.trim() || '' : query.trim() || '()';
}
