// Result.js
import React from "react";
import List from "./List";

const Result = ({ data, handleFindAvailableTime }) => {
  return <div>{data && <List data={data} />}</div>;
};

export default Result;
