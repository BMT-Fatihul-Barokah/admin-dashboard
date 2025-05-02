/**
 * Utility functions for exporting data to CSV/Excel format
 */

/**
 * Convert array of objects to CSV string
 * @param data Array of objects to convert
 * @param headers Optional custom headers (keys of objects to include)
 * @returns CSV formatted string
 */
export function convertToCSV<T extends Record<string, any>>(
  data: T[],
  headers?: string[]
): string {
  if (!data || data.length === 0) {
    return '';
  }

  // If headers are not provided, use all keys from the first object
  const headerRow = headers || Object.keys(data[0]);
  
  // Create header row
  let csvContent = headerRow.join(',') + '\n';
  
  // Create data rows
  data.forEach(item => {
    const row = headerRow.map(header => {
      // Get the value and handle special cases
      const value = item[header];
      
      // Handle null or undefined values
      if (value === null || value === undefined) {
        return '';
      }
      
      // Handle strings that may contain commas or quotes
      if (typeof value === 'string') {
        // Escape quotes and wrap in quotes if contains comma, quote or newline
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }
      
      // Handle dates
      if (value instanceof Date) {
        return value.toISOString();
      }
      
      // Handle other types
      return String(value);
    });
    
    csvContent += row.join(',') + '\n';
  });
  
  return csvContent;
}

/**
 * Download data as a CSV file
 * @param data Array of objects to export
 * @param filename Filename for the downloaded file (without extension)
 * @param headers Optional custom headers (keys to include)
 */
export function downloadCSV<T extends Record<string, any>>(
  data: T[],
  filename: string,
  headers?: string[]
): void {
  if (!data || data.length === 0) {
    console.warn('No data to export');
    return;
  }

  const csvContent = convertToCSV(data, headers);
  
  // Create a Blob with the CSV content
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  
  // Create a download link
  const link = document.createElement('a');
  
  // Create the download URL
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  
  // Append to the document, trigger click, and clean up
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Release the URL object
  URL.revokeObjectURL(url);
}

/**
 * Format data for export with custom field mappings and transformations
 * @param data Raw data to format
 * @param fieldMap Mapping of original field names to export field names
 * @param transformFunctions Optional functions to transform values
 * @returns Formatted data ready for export
 */
export function formatDataForExport<T extends Record<string, any>, R extends Record<string, any>>(
  data: T[],
  fieldMap: Record<string, string>,
  transformFunctions?: Partial<Record<keyof R, (value: any, row: T) => any>>
): R[] {
  return data.map(item => {
    const formattedItem: Record<string, any> = {};
    
    Object.entries(fieldMap).forEach(([originalField, exportField]) => {
      // Get the original value
      const value = item[originalField];
      
      // Apply transform function if available
      if (transformFunctions && transformFunctions[exportField as keyof R]) {
        formattedItem[exportField] = transformFunctions[exportField as keyof R]!(value, item);
      } else {
        formattedItem[exportField] = value;
      }
    });
    
    return formattedItem as R;
  });
}
