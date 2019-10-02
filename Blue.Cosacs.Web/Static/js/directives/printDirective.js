define(['jquery'], function ($) {
    'use strict';

    var printDirective = function () {

        var printSection = document.getElementById('printSection');
        // if there is no printing section, create one
        if (!printSection) {
            printSection = document.createElement('div');
            printSection.id = 'printSection';
            document.body.appendChild(printSection);
        }
        function link(scope, element, attrs) {
            element.on('click', function () {
                var elemToPrint = document.getElementById(attrs.printElementId);
                if (elemToPrint) {
                    if(attrs.useFrame){
                    printElementWithIFrame(scope, elemToPrint);}
                    else{
                        printElement(scope, elemToPrint);
                    }
                }
            });
            window.onafterprint = function () {
                endPrinting(scope);
            };
        }

        function endPrinting(scope) {
            // clean the print section before adding new content
            printSection.innerHTML = '';
            scope.$apply(function () {
                scope.isPrintDone = true;
            });
        }

        function printElement(scope, elem) {
            // clones the element you want to print
            var domClone = elem.cloneNode(true);
            printSection.appendChild(domClone);
            window.print();

            // this just in case 'onafterprint' didn't fire
            setTimeout(function () {
                endPrinting(scope);
            }, 2000);

        }

        function printElementWithIFrame(scope, elem) {
            if ($('iframe#printf').size() === 0) {
                $('html').append('<iframe id="printf" name="printf"></iframe>');

                var mywindow = window.frames.printf;


                mywindow.document.write('<html><head><title></title><style>@page {margin: 25mm 0mm 25mm 5mm}</style>' +
                    '</head><body>' + elem.innerHTML + '</body></html>');

                $(mywindow.document).ready(function () {
                    mywindow.print();
                    setTimeout(function () {
                            $('iframe#printf').remove();
                        },
                        2000);  // The iFrame is removed 2 seconds after print() is executed, which is enough for me, but you can play around with the value
                });

                window.onafterprint = function () {
                    endPrinting(scope);
                };
            }

            return true;
        }


            return {
                link: link,
                restrict: 'A'
            };
        };


        return printDirective;

    }
    );
