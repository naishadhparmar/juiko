function Instrument({ instrument }) {
    return (
        <tr key={instrument.id}>
            <td>{instrument.id}</td>
            <td>{instrument.financial_institution}</td>
            <td>{instrument.account_name}</td>
            <td>{instrument.instrument_type}</td>
        </tr>
    );
}

export default function FilterableInstrumentTable({ instruments }) {
  return (
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Financial Institution</th>
          <th>Account Name</th>
          <th>Instrument Type</th>
        </tr>
      </thead>
      <tbody> 
            {instruments.map((instrument) => ( 
                <Instrument instrument={instrument} />
            ))}
        </tbody>
    </table>
  );
}
