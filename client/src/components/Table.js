import React, { Component } from "react";

const Row = fields => data => (
  <tr>
    <th>{data.id}</th>
    {fields.map(f => <td key={f}>{data.content[f]}</td>)}
  </tr>
);

export const Table = fields => {
  const header = (
    <thead>
      <tr>
        <th />
        {fields.map(f => <th key={f}>{f}</th>)}
      </tr>
    </thead>
  );
  return data => (
    <table className="table">
      {header}
      <tbody>{data.map(Row(fields))}</tbody>
    </table>
  );
};
