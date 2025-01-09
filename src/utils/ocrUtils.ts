interface ExtractedFields {
  sapNumber?: string;
  barcode?: string;
  storeLocation?: string;
  bolNumber?: string;
  quantity?: number;
}

export const extractFieldsFromText = (text: string): ExtractedFields => {
  const lines = text.split('\n');
  const fields: ExtractedFields = {};

  console.log('Processing text:', text);
  console.log('Split into lines:', lines);

  // First pass: Process each line for exact matches
  lines.forEach(line => {
    const cleanLine = line.trim();
    console.log('Processing line:', cleanLine);

    // Extract "#U:" pattern for units
    const unitsMatch = cleanLine.match(/^#U:\s*(\d+)$/i) || 
                      cleanLine.match(/#\s*of\s*units\s*:\s*(\d+)/i);
    if (unitsMatch) {
      console.log('Found Units match:', unitsMatch[1]);
      fields.quantity = parseInt(unitsMatch[1], 10);
    }

    // Extract "I:" or "Item:" pattern for item number
    const itemMatch = cleanLine.match(/^I:\s*(\d+)$/i) || 
                     cleanLine.match(/^Item\s*:\s*(\d+)$/i) ||
                     cleanLine.match(/item\s*:\s*(\d+)/i);
    if (itemMatch) {
      console.log('Found Item match:', itemMatch[1]);
      fields.sapNumber = itemMatch[1];
    }

    // Extract both P- and PRM- Barcode formats with enhanced pattern matching
    const barcodePatterns = [
      /(?:PRM-)\d{6}-\d{6}/i,
      /(?:P-)\d{6}-\d{6}/i,
      /PRM\d{6}\d{6}/i,
      /P\d{6}\d{6}/i
    ];

    for (const pattern of barcodePatterns) {
      const barcodeMatch = cleanLine.match(pattern);
      if (barcodeMatch) {
        console.log('Found barcode match:', barcodeMatch[0]);
        // Clean up the barcode and ensure proper format
        let barcode = barcodeMatch[0].replace(/\s+/g, '');
        
        // Add hyphens if missing
        if (!barcode.includes('-')) {
          if (barcode.startsWith('PRM')) {
            barcode = `PRM-${barcode.slice(3, 9)}-${barcode.slice(9)}`;
          } else if (barcode.startsWith('P')) {
            barcode = `P-${barcode.slice(1, 7)}-${barcode.slice(7)}`;
          }
        }
        
        fields.barcode = barcode;
        break;
      }
    }
  });

  // Second pass: Process the entire text as one string for cases where line breaks might interfere
  if (!fields.quantity || !fields.sapNumber || !fields.barcode) {
    const fullText = text.replace(/\n/g, ' ').replace(/\s+/g, ' ');
    
    // Fallback for units
    if (!fields.quantity) {
      const unitsMatch = fullText.match(/#U:\s*(\d+)/i) ||
                        fullText.match(/#\s*of\s*units\s*:\s*(\d+)/i);
      if (unitsMatch) {
        console.log('Found Units from fulltext:', unitsMatch[1]);
        fields.quantity = parseInt(unitsMatch[1], 10);
      }
    }

    // Fallback for item with both formats
    if (!fields.sapNumber) {
      const itemMatch = fullText.match(/I:\s*(\d+)/i) ||
                       fullText.match(/Item\s*:\s*(\d+)/i) ||
                       fullText.match(/item\s*:\s*(\d+)/i);
      if (itemMatch) {
        console.log('Found Item from fulltext:', itemMatch[1]);
        fields.sapNumber = itemMatch[1];
      }
    }

    // Fallback for barcode
    if (!fields.barcode) {
      for (const pattern of barcodePatterns) {
        const barcodeMatch = fullText.match(pattern);
        if (barcodeMatch) {
          let barcode = barcodeMatch[0].replace(/\s+/g, '');
          if (!barcode.includes('-')) {
            if (barcode.startsWith('PRM')) {
              barcode = `PRM-${barcode.slice(3, 9)}-${barcode.slice(9)}`;
            } else if (barcode.startsWith('P')) {
              barcode = `P-${barcode.slice(1, 7)}-${barcode.slice(7)}`;
            }
          }
          fields.barcode = barcode;
          break;
        }
      }
    }
  }

  console.log('Final extracted fields:', fields);
  return fields;
};