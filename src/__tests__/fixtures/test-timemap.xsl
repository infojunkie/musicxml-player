<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="text"/>
  
  <!-- Simple test XSLT that generates a basic timemap JSON -->
  <xsl:template match="/">
    <xsl:text>[{"measure": 1, "timestamp": 0, "duration": 1000}]</xsl:text>
  </xsl:template>
</xsl:stylesheet>

