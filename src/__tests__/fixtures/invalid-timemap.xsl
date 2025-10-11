<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="text"/>
  <xsl:template match="/">
    <xsl:text>not-json</xsl:text>
  </xsl:template>
  <!-- Intentionally produces invalid JSON to trigger JSON.parse error in tests -->
</xsl:stylesheet>

