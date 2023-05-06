(line (statement (def_statement
  (library_keyword)
	[(numeric_function_definition
    	(parameter_list)? @params
    	(numeric_expression)? @expr)
    (string_function_definition
    	(parameter_list)? @params
    	(string_expression)? @expr)]?
) @def))