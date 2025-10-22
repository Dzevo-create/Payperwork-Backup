/**
 * Mock for next/link
 */

import React from "react";

const Link = ({ children, href, ...props }: any) => {
  return (
    <a href={href} {...props}>
      {children}
    </a>
  );
};

export default Link;
