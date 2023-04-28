(line (statement (def_statement
	[(numeric_function_definition
    	(parameter_list)? @params
    	(numeric_expression)? @expr)
    (string_function_definition
    	(parameter_list)? @params
    	(string_expression)? @expr)]?
) @def))
(fnend_statement) @fnend