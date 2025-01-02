import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Papa from 'papaparse';
import Cookies from 'js-cookie';

const CoursePage = ({ data }) => {
  const { courseId } = useParams();
  const [htmlMessage, setHtmlMessage] = useState("");

  // ---------- State ----------
  const [packingList, setPackingList] = useState([]);
  const [documentLink, setDocumentLink] = useState('');
  const [courseInfo, setCourseInfo] = useState({});

  // "Needed" items
  const [neededList, setNeededList] = useState([]);
  const [customNeededList, setCustomNeededList] = useState([]);
  const [buildCartProcessing, setBuildCartProcessing] = useState(false);

  // Desired quantities (for numeric selector)
  const [desiredQuantities, setDesiredQuantities] = useState({});

  // Color states for each row: "red", "yellow", or "green"
  const [colorStates, setColorStates] = useState([]);

  // Quick checkmark fade
  const [lastAddedIndex, setLastAddedIndex] = useState(null);
  const [showCheckmark, setShowCheckmark] = useState(false);

  // Count how many items aren't green
  const notGreenCount = colorStates.filter((c) => c !== 'green').length;

  // ---------- 1) Fetch course data once ----------
  useEffect(() => {
    // 1) Find the matching row from the master spreadsheet
    const courseRow = data.find((row) => row.id === courseId);
  
    // 2) If there's a match, set the document link, title, and message from the master sheet
    if (courseRow) {
      // Pull from the master sheet columns
      setDocumentLink(courseRow.CoursePagePDF || '');
      setCourseInfo({
        title: courseRow.title || 'No Title Available',
        message: courseRow.message || 'No additional information available.',
      });
    }
  
    // 3) Fetch the packing list from the child sheet using courseSheetUrl (if it exists)
    const fetchCourseData = async () => {
      try {
        if (!courseRow?.courseSheetUrl) {
          console.warn('No courseSheetUrl provided for this course');
          return;
        }
        const response = await fetch(courseRow.courseSheetUrl);
        const text = await response.text();
        const parsedData = Papa.parse(text, { header: true, delimiter: '\t' }).data;
  
        // The packing list starts at parsedData.slice(1) or wherever your items begin
        setPackingList(parsedData.slice(1));
      } catch (error) {
        console.error('Error fetching course data:', error);
      }
    };
  
    fetchCourseData();
  }, [courseId, data]);
  

  // ---------- 2) On mount, restore states from cookies, *per* courseId ----------
  useEffect(() => {
    // colorStates
    const savedColors = Cookies.get(`colorStates_${courseId}`);
    if (savedColors) {
      try {
        const parsed = JSON.parse(savedColors);
        if (Array.isArray(parsed)) setColorStates(parsed);
      } catch {}
    }

    // neededList
    const savedNeeded = Cookies.get(`neededList_${courseId}`);
    if (savedNeeded) {
      try {
        const parsedNeeded = JSON.parse(savedNeeded);
        if (Array.isArray(parsedNeeded)) setNeededList(parsedNeeded);
      } catch {}
    }

    // customNeededList
    const savedCustom = Cookies.get(`customNeededList_${courseId}`);
    if (savedCustom) {
      try {
        const parsedCustom = JSON.parse(savedCustom);
        if (Array.isArray(parsedCustom)) setCustomNeededList(parsedCustom);
      } catch {}
    }

    // desiredQuantities
    const savedQuantities = Cookies.get(`desiredQuantities_${courseId}`);
    if (savedQuantities) {
      try {
        const parsedQ = JSON.parse(savedQuantities);
        if (parsedQ && typeof parsedQ === 'object') setDesiredQuantities(parsedQ);
      } catch {}
    }
  }, [courseId]);

  // ---------- 3) Save states to cookies *per* courseId ----------
  useEffect(() => {
    if (colorStates.length > 0) {
      Cookies.set(`colorStates_${courseId}`, JSON.stringify(colorStates), { expires: 7 });
    }
  }, [colorStates, courseId]);

  useEffect(() => {
    Cookies.set(`neededList_${courseId}`, JSON.stringify(neededList), { expires: 7 });
  }, [neededList, courseId]);

  useEffect(() => {
    Cookies.set(`customNeededList_${courseId}`, JSON.stringify(customNeededList), { expires: 7 });
  }, [customNeededList, courseId]);

  useEffect(() => {
    Cookies.set(`desiredQuantities_${courseId}`, JSON.stringify(desiredQuantities), { expires: 7 });
  }, [desiredQuantities, courseId]);

  // ---------- 4) Once packingList is loaded, default color states & desiredQuantities ----------
  useEffect(() => {
    if (packingList.length) {
      // If we have no colorStates loaded from cookies, fill with 'red'
      if (colorStates.length === 0) {
        setColorStates(Array(packingList.length).fill('red'));
      }
      // If no desiredQuantities from cookies, default them
      if (Object.keys(desiredQuantities).length === 0) {
        const initQ = {};
        packingList.forEach((item, i) => {
          const rec = parseInt(item.Recommended, 10);
          initQ[i] = !isNaN(rec) ? rec : 1;
        });
        setDesiredQuantities(initQ);
      }
    }
  }, [packingList, colorStates.length, desiredQuantities]);

  // ---------- Helpers ----------
  const isValidUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  // Cycle the color on click: red -> yellow -> green -> red
  const cycleColorAtIndex = (index) => {
    setColorStates((prev) => {
      const updated = [...prev];
      const current = updated[index] || 'red';

      if (current === 'red') {
        updated[index] = 'yellow';
      } else if (current === 'yellow') {
        updated[index] = 'green';
      } else {
        // covers 'green' or anything else => go to 'red'
        updated[index] = 'red';
      }
      return updated;
    });
  };

  // Optionally set row green by index
  const setRowGreenByIndex = (index) => {
    setColorStates((prev) => {
      const updated = [...prev];
      updated[index] = 'green';
      return updated;
    });
  };

  // Set row green by matching item
  const setRowGreenByItem = (item) => {
    const foundIndex = packingList.findIndex(
      (p) => p.ITEM === item.ITEM && p.LINK === item.LINK
    );
    if (foundIndex !== -1) {
      setRowGreenByIndex(foundIndex);
    }
  };

  // Numeric quantity input
  const handleQuantityChange = (index, newVal) => {
    setDesiredQuantities((prev) => ({
      ...prev,
      [index]: newVal,
    }));
  };

  // Checkbox toggles color => green if checked, else revert
  const handleCheckboxToggle = (item, index, isChecked) => {
    setColorStates((prev) => {
      const updated = [...prev];
      // if checked => green, else if item is in 'neededList' => yellow, else red
      updated[index] = isChecked
        ? 'green'
        : neededList.includes(item)
        ? 'yellow'
        : 'red';
      return updated;
    });
  };

  // Add item to needed => color => yellow
  const handleAddToNeeded = (item, index) => {
    setColorStates((prev) => {
      const updated = [...prev];
      updated[index] = 'yellow';
      return updated;
    });

    const qty = parseInt(desiredQuantities[index], 10) || 1;
    const clonedItem = { ...item, QUANTITY: qty, crossedOff: false };

    if (item.Custom === 'T') {
      setCustomNeededList((prev) => [...prev, clonedItem]);
    } else {
      setNeededList((prev) => [...prev, clonedItem]);
    }

    setLastAddedIndex(index);
    setShowCheckmark(true);
    setTimeout(() => setShowCheckmark(false), 1000);
  };

  // Link click => cross off & color => green
  const handleLinkClick = (listType, idx) => {
    if (listType === 'regular') {
      const clickedItem = neededList[idx];
      setNeededList((prev) =>
        prev.map((it, i) => (i === idx ? { ...it, crossedOff: true } : it))
      );
      setRowGreenByItem(clickedItem);
    } else {
      const clickedItem = customNeededList[idx];
      setCustomNeededList((prev) =>
        prev.map((it, i) => (i === idx ? { ...it, crossedOff: true } : it))
      );
      setRowGreenByItem(clickedItem);
    }
  };

  // Remove an item from needed
  const handleRemoveNeededItem = (idx) => {
    const removedItem = neededList[idx];
    if (removedItem) {
      setRowGreenByItem(removedItem);
    }
    setNeededList((prev) => prev.filter((_, i) => i !== idx));
  };

  // Remove an item from custom
  const handleRemoveCustomItem = (idx) => {
    const removedItem = customNeededList[idx];
    if (removedItem) {
      setRowGreenByItem(removedItem);
    }
    setCustomNeededList((prev) => prev.filter((_, i) => i !== idx));
  };

  // Update quantity in needed
  const handleUpdateNeededQuantity = (idx, newVal) => {
    setNeededList((prev) =>
      prev.map((itm, i) => (i === idx ? { ...itm, QUANTITY: newVal } : itm))
    );
  };

  // Update quantity in custom
  const handleUpdateCustomQuantity = (idx, newVal) => {
    setCustomNeededList((prev) =>
      prev.map((itm, i) => (i === idx ? { ...itm, QUANTITY: newVal } : itm))
    );
  };

  // ---------- Bulk checkout ----------
  // This builds a cart link for the first 10 uncrossed items in neededList,
  // marks them crossed off, and sets their row color to green.
  const buildCart = () => {
    setBuildCartProcessing(true);

    // 1. Filter out the items already crossed off
    const uncrossedItems = neededList.filter((item) => !item.crossedOff);

    // 2. If none left uncrossed, bail
    if (uncrossedItems.length === 0) {
      alert('No uncrossed items to bulk checkout!');
      setBuildCartProcessing(false);
      return;
    }

    // 3. Take the first 10 from uncrossed items
    const itemsBatch = uncrossedItems.slice(0, 10);

    // Build your Amazon cart URL
    const baseUrl = 'https://www.amazon.com/gp/aws/cart/add.html';
    const urlParams = new URLSearchParams();

    itemsBatch.forEach((itm, idx) => {
      const paramIndex = idx + 1;
      urlParams.set(`ASIN.${paramIndex}`, itm.ASIN);
      urlParams.set(`Quantity.${paramIndex}`, itm.QUANTITY || 1);
      if (itm.OFFER_ID) {
        urlParams.set(`OfferListingId.${paramIndex}`, itm.OFFER_ID);
      }
    });

    // Use your AssociateTag here
    urlParams.set('AssociateTag', 'ceprince-20');
    const finalUrl = `${baseUrl}?${urlParams.toString()}`;

    // 4. Open in a new tab
    window.open(finalUrl, '_blank', 'noopener,noreferrer');

    // 5. Cross off these items
    const updatedNeeded = neededList.map((it) =>
      itemsBatch.includes(it) ? { ...it, crossedOff: true } : it
    );
    setNeededList(updatedNeeded);

    // 6. Also color them green
    itemsBatch.forEach((itm) => setRowGreenByItem(itm));

    setBuildCartProcessing(false);
  };

  // ---------- Render ----------
  return (
    <div
      style={{
        backgroundColor: '#fff',
        color: '#000',
        minHeight: '100vh',
        padding: '1rem',
      }}
    >
      {/* Return to main page link at the top */}
      <Link
        to="/"
        style={{ display: 'block', marginTop: '1.5rem', color: 'blue', fontWeight: 'bold' }}
      >
        Return to Main Page
      </Link>

      {/* Tally at the top */}
      <div style={{ marginBottom: '0.5rem', fontWeight: 'bold', color: '#000' }}>
        Items not green: {notGreenCount}
      </div>

      <h1 style={{ color: '#000' }}>{courseInfo.title}</h1>
      <p style={{ color: '#000' }}>{courseInfo.message}</p>

      {/* Download/Print Button if valid doc link */}
      {documentLink && isValidUrl(documentLink) && (
        <button
          onClick={() => window.open(documentLink, '_blank', 'noopener,noreferrer')}
          style={{
            backgroundColor: '#fff',
            color: 'blue',
            border: '2px solid blue',
            padding: '8px 12px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold',
            marginBottom: '1rem',
          }}
        >
          Download/Print Packing List
        </button>
      )}

      {/* Main table container - horizontally scrollable */}
      <div style={{ maxWidth: '100%', overflowX: 'auto', marginTop: '1rem' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            minWidth: '600px',
            backgroundColor: '#fff',
            color: '#000',
          }}
        >
          <thead
            style={{
              position: 'sticky',
              top: 0,
              background: '#f7f7f7',
              zIndex: 2,
              color: '#000',
            }}
          >
            <tr>
              <th style={{ width: '50px', padding: '6px' }} />
              <th style={{ textAlign: 'left', padding: '6px' }}>Item</th>
              <th style={{ textAlign: 'left', padding: '6px' }}>Quantity</th>
              <th style={{ padding: '6px' }} />
              <th style={{ textAlign: 'center', padding: '6px', color: '#000' }}>
                Add to Needed
              </th>
              <th style={{ textAlign: 'center', padding: '6px', color: '#000' }}>
                Check
              </th>
            </tr>
          </thead>
          <tbody>
            {packingList.map((item, index) => {
              const rowStyle = {};
              if (item['M/O'] === 'M') {
                rowStyle.backgroundColor = 'rgba(255, 255, 0, 0.5)';
                rowStyle.color = '#000';
              }

              const squareColor = colorStates[index] || 'red';
              const validLink = item.LINK && isValidUrl(item.LINK);

              return (
                <tr key={index} style={rowStyle}>
                  {/* Color square cell */}
                  <td style={{ padding: 0, verticalAlign: 'top' }}>
                    <div
                      onClick={() => cycleColorAtIndex(index)}
                      style={{
                        backgroundColor: squareColor,
                        width: '100%',
                        minWidth: '60px',
                        minHeight: '60px',
                        cursor: 'pointer',
                      }}
                    />
                  </td>

                  {/* Item name */}
                  <td style={{ padding: '8px', position: 'relative', color: '#000' }}>
                    {item.ITEM || 'No Data'}
                    {showCheckmark && lastAddedIndex === index && (
                      <span
                        style={{
                          position: 'absolute',
                          left: '-20px',
                          color: 'green',
                          fontWeight: 'bold',
                          transition: 'opacity 1s',
                        }}
                      >
                        ✓
                      </span>
                    )}
                  </td>

                  {/* QUANTITY from sheet */}
                  <td style={{ padding: '8px', color: '#000' }}>
                    {item.QUANTITY || '0'}
                  </td>

                  {/* Numeric selector */}
                  <td style={{ padding: '8px' }}>
                    <input
                      type="number"
                      min="1"
                      value={desiredQuantities[index] || ''}
                      onChange={(e) => handleQuantityChange(index, e.target.value)}
                      style={{
                        width: '40px',
                        backgroundColor: '#fff',
                        color: '#000',
                        border: '1px solid #000',
                      }}
                    />
                  </td>

                  {/* Add to Needed */}
                  <td style={{ textAlign: 'center', padding: '2px 2px' }}>
                    {validLink ? (
                      <button
                        onClick={() => handleAddToNeeded(item, index)}
                        style={{
                          backgroundColor: '#fff',
                          color: '#000',
                          border: '1px solid #000',
                          padding: '5px 5px',
                          cursor: 'pointer',
                        }}
                      >
                        Add to Needed
                      </button>
                    ) : (
                      <span style={{ color: '#000' }}>No Link</span>
                    )}
                  </td>

                  {/* Checkbox => toggles green/revert */}
                  <td style={{ textAlign: 'center', padding: '8px' }}>
                    <input
                      type="checkbox"
                      style={{
                        width: '35px',
                        height: '35px',
                        backgroundColor: '#fff',
                        color: '#000',
                        accentColor: '#000',
                        border: '1px solid #000',
                      }}
                      checked={squareColor === 'green'}
                      onChange={(e) =>
                        handleCheckboxToggle(item, index, e.target.checked)
                      }
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* "Needed" items section */}
      <div style={{ marginTop: '2rem' }}>
        <h3 style={{ color: '#000' }}>Needed Items</h3>

        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          {/* Cart Checkout (non-custom) */}
          <div style={{ flex: '1 1 300px', color: '#000' }}>
            <h4 style={{ color: '#000' }}>Cart Checkout</h4>
            {neededList.length === 0 ? (
              <p style={{ color: '#000' }}>No direct-cart items added.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ color: '#000' }}>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '6px' }}>Item</th>
                    <th style={{ textAlign: 'left', padding: '6px' }}>Quantity</th>
                    <th style={{ textAlign: 'left', padding: '6px' }}>Link</th>
                    <th style={{ width: '40px' }} />
                  </tr>
                </thead>
                <tbody>
                  {neededList.map((itm, idx) => (
                    <tr key={idx}>
                      <td
                        style={{
                          padding: '6px',
                          textDecoration: itm.crossedOff ? 'line-through' : 'none',
                          color: '#000',
                        }}
                      >
                        {itm.ITEM}
                      </td>
                      <td style={{ padding: '6px' }}>
                        <input
                          type="number"
                          min="1"
                          value={itm.QUANTITY}
                          onChange={(e) =>
                            handleUpdateNeededQuantity(
                              idx,
                              parseInt(e.target.value, 10) || 1
                            )
                          }
                          style={{
                            width: '60px',
                            backgroundColor: '#fff',
                            color: '#000',
                            border: '1px solid #000',
                          }}
                        />
                      </td>
                      <td style={{ padding: '6px' }}>
                        <a
                          href={itm.LINK}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ textDecoration: 'underline', color: 'blue' }}
                          onClick={() => handleLinkClick('regular', idx)}
                        >
                          {itm.LINK}
                        </a>
                      </td>
                      <td style={{ padding: '6px', textAlign: 'center' }}>
                        <button
                          onClick={() => handleRemoveNeededItem(idx)}
                          style={{
                            backgroundColor: '#fff',
                            color: '#000',
                            border: '1px solid #000',
                            cursor: 'pointer',
                          }}
                        >
                          X
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Bulk checkout button goes immediately below the 'neededList' section */}
          <button
            onClick={buildCart}
            disabled={buildCartProcessing || neededList.length === 0}
            style={{
              marginTop: '1.5rem',
              backgroundColor: '#fff',
              color: '#000',
              border: '1px solid #000',
              cursor: 'pointer',
              padding: '6px 10px',
              height: 'fit-content',
            }}
          >
            {buildCartProcessing ? 'Building...' : 'Bulk Checkout'}
          </button>

          {/* Custom items (direct checkout) */}
          <div style={{ flex: '1 1 300px', color: '#000' }}>
            <h4 style={{ color: '#000' }}>Direct Checkout Needed</h4>
            {customNeededList.length === 0 ? (
              <p style={{ color: '#000' }}>No direct-checkout items added.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ color: '#000' }}>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '6px' }}>Item</th>
                    <th style={{ textAlign: 'left', padding: '6px' }}>Quantity</th>
                    <th style={{ textAlign: 'left', padding: '6px' }}>Link</th>
                    <th style={{ width: '40px' }} />
                  </tr>
                </thead>
                <tbody>
                  {customNeededList.map((itm, idx) => (
                    <tr key={idx}>
                      <td
                        style={{
                          padding: '6px',
                          textDecoration: itm.crossedOff ? 'line-through' : 'none',
                          color: '#000',
                        }}
                      >
                        {itm.ITEM}
                      </td>
                      <td style={{ padding: '6px' }}>
                        <input
                          type="number"
                          min="1"
                          value={itm.QUANTITY}
                          onChange={(e) =>
                            handleUpdateCustomQuantity(
                              idx,
                              parseInt(e.target.value, 10) || 1
                            )
                          }
                          style={{
                            width: '60px',
                            backgroundColor: '#fff',
                            color: '#000',
                            border: '1px solid #000',
                          }}
                        />
                      </td>
                      <td style={{ padding: '6px' }}>
                        <a
                          href={itm.LINK}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ textDecoration: 'underline', color: 'blue' }}
                          onClick={() => handleLinkClick('custom', idx)}
                        >
                          {itm.LINK}
                        </a>
                      </td>
                      <td style={{ padding: '6px', textAlign: 'center' }}>
                        <button
                          onClick={() => handleRemoveCustomItem(idx)}
                          style={{
                            backgroundColor: '#fff',
                            color: '#000',
                            border: '1px solid #000',
                            cursor: 'pointer',
                          }}
                        >
                          X
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Tally at the bottom */}
      <div style={{ marginTop: '1rem', fontWeight: 'bold', color: '#000' }}>
        Items not green: {notGreenCount}
      </div>

      {/* Another link to return at bottom, if desired */}
      <Link
        to="/"
        style={{ display: 'block', marginTop: '1.5rem', color: 'blue', fontWeight: 'bold' }}
      >
        Return to Main Page
      </Link>
    </div>
  );
};

export default CoursePage;
