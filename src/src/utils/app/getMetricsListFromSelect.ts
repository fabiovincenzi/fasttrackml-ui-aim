import { ISyntaxErrorDetails } from 'types/components/NotificationContainer/NotificationContainer';
import { ISelectConfig } from 'types/services/models/explorer/createAppModel';

import { jsValidVariableRegex } from 'utils/getObjectPaths';

import { formatValue } from '../formatValue';

export default function getMetricsListFromSelect(
  selectData: ISelectConfig,
  error?: ISyntaxErrorDetails,
): string[] {
  const metricsList: string[] = [];

  if (selectData === undefined) {
    return metricsList;
  }

  selectData.options?.forEach((option) => {
    const metricName = option.value?.option_name ?? '';
    const context: string =
      option.value?.context === null
        ? ''
        : Object.keys(option.value?.context)
            .map((item) => {
              const contextKey = !jsValidVariableRegex.test(item)
                ? `['${item}']`
                : `${item}`;
              const contextValue = (option.value?.context as any)[item];
              return `"${contextKey}":${formatValue(contextValue)}`;
            })
            .join(', ');

    metricsList.push(`${metricName}-{${context}}`);
  });

  return metricsList;
}
